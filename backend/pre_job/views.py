from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import RFQ, Quotation, PurchaseOrder, QuotationTerms
from .serializers import RFQSerializer, QuotationSerializer, PurchaseOrderSerializer, QuotationTermsSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
import tempfile
from item.models import Item  # Add this import
from unit.models import Unit  # Add this import
import os
from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from series.models import NumberSeries 

class RFQViewSet(viewsets.ModelViewSet):
    queryset = RFQ.objects.all()
    serializer_class = RFQSerializer
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('QUO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_rfqs = RFQ.objects.filter(
                series_number__startswith='QUO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for rfq in subsequent_rfqs:
                current_sequence = int(rfq.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                rfq.series_number = f"QUO-PRIME-{new_sequence:06d}"
                rfq.save()
        return Response(status=204)
    
    
    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        rfq = self.get_object()
        status = request.data.get('rfq_status')
        
        valid_statuses = [choice[0] for choice in RFQ._meta.get_field('rfq_status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        
        rfq.rfq_status = status
        rfq.save()
        
        serializer = self.get_serializer(rfq)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='process_excel')
    def process_excel(self, request):
        """
        Process Excel file and return created items
        Handles 500+ items efficiently
        """
        try:
            if 'excel_file' not in request.FILES:
                return Response(
                    {"error": "No Excel file provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            excel_file = request.FILES['excel_file']
            
            # Validate file type
            if not excel_file.name.endswith(('.xlsx', '.xls', '.csv')):
                return Response(
                    {"error": "Only Excel (.xlsx, .xls) and CSV files are allowed"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                for chunk in excel_file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            try:
                # Process the Excel file
                result = self._process_excel_file(tmp_file_path)
                return Response(result, status=status.HTTP_200_OK)
                
            finally:
                # Clean up temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)
                    
        except Exception as e:
            print(f"Excel processing error: {str(e)}")
            return Response(
                {"error": f"Failed to process Excel file: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_excel_file(self, file_path):
        """Process Excel file and return items data"""
        try:
            # Read Excel file
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            
            # Normalize column names
            df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
            
            # Map column names
            column_mapping = {
                'item': ['item', 'name', 'item_name', 'description'],
                'quantity': ['quantity', 'qty', 'qty.', 'amount'],
                'unit': ['unit', 'units', 'uom', 'measurement'],
                'unit_price': ['unit_price', 'price', 'unitprice', 'cost'],
                'sl_no': ['sl_no', 'sl.no', 'sl', 'sno', 'id']
            }
            
            # Find actual column names
            actual_columns = {}
            for standard_name, possible_names in column_mapping.items():
                for possible in possible_names:
                    if possible in df.columns:
                        actual_columns[standard_name] = possible
                        break
            
            # Check required columns
            if 'item' not in actual_columns or 'quantity' not in actual_columns:
                return {
                    "error": "Excel must contain 'Item' and 'Quantity' columns",
                    "found_columns": list(df.columns)
                }
            
            items_data = []
            created_items = []
            created_units = []
            
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        # Extract data
                        item_name = str(row[actual_columns['item']]).strip()
                        quantity_str = str(row[actual_columns['quantity']]).strip()
                        unit_name = str(row.get(actual_columns.get('unit', ''), 'Each')).strip()
                        price_str = str(row.get(actual_columns.get('unit_price', ''), '')).strip()
                        sl_no = row.get(actual_columns.get('sl_no', ''), index + 1)
                        
                        # Skip empty rows
                        if not item_name or not quantity_str:
                            continue
                        
                        # Convert quantity and price
                        try:
                            quantity = float(quantity_str) if quantity_str else 1
                        except (ValueError, TypeError):
                            quantity = 1
                        
                        try:
                            unit_price = float(price_str) if price_str else None
                        except (ValueError, TypeError):
                            unit_price = None
                        
                        # Get or create item
                        item_obj, item_created = Item.objects.get_or_create(
                            name__iexact=item_name,
                            defaults={'name': item_name}
                        )
                        if item_created:
                            created_items.append(item_name)
                        
                        # Get or create unit
                        unit_obj, unit_created = Unit.objects.get_or_create(
                            name__iexact=unit_name,
                            defaults={'name': unit_name}
                        )
                        if unit_created:
                            created_units.append(unit_name)
                        
                        # Prepare item data
                        item_data = {
                            'sl_no': int(sl_no) if sl_no else index + 1,
                            'item': item_obj.id,
                            'item_name': item_obj.name,
                            'quantity': quantity,
                            'unit': unit_obj.id,
                            'unit_name': unit_obj.name,
                            'unit_price': unit_price
                        }
                        
                        items_data.append(item_data)
                        
                    except Exception as e:
                        print(f"Error processing row {index}: {e}")
                        continue
            
            return {
                "success": True,
                "items": items_data,
                "total_items": len(items_data),
                "created_items": created_items,
                "created_units": created_units,
                "message": f"Successfully processed {len(items_data)} items"
            }
            
        except Exception as e:
            print(f"Excel parsing error: {str(e)}")
            return {
                "error": f"Failed to parse Excel file: {str(e)}",
                "success": False
            }
    
    
    

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        rfq_id = self.request.query_params.get('rfq')
        if rfq_id:
            queryset = queryset.filter(rfq=rfq_id)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('QUO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_quotations = Quotation.objects.filter(
                series_number__startswith='QUO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for quotation in subsequent_quotations:
                current_sequence = int(quotation.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                quotation.series_number = f"QUO-PRIME-{new_sequence:06d}"
                quotation.save()
        return Response(status=204)

    # ✅ ADD THIS ACTION for updating terms
    @action(detail=True, methods=['post', 'put', 'patch'], url_path='update-terms')
    def update_terms(self, request, pk=None):
        """Update terms for a specific quotation"""
        quotation = self.get_object()
        terms_content = request.data.get('content', '')
        
        if not terms_content:
            return Response(
                {"error": "Terms content is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if quotation.terms:
            # Update existing terms
            quotation.terms.content = terms_content
            quotation.terms.save()
        else:
            # Create new terms for this quotation
            new_terms = QuotationTerms.objects.create(content=terms_content)
            quotation.terms = new_terms
            quotation.save()
            
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        quotation = self.get_object()
        status = request.data.get('status')
        not_approved_reason_remark = request.data.get('not_approved_reason_remark')
        
        valid_statuses = [choice[0] for choice in Quotation._meta.get_field('quotation_status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        
        if status == 'Not Approved' and not not_approved_reason_remark:
            return Response({"detail": "Reason is required when setting status to 'Not Approved'"}, status=400)
        
        was_not_approved = quotation.quotation_status == 'Not Approved'
        quotation.quotation_status = status
        if status == 'Not Approved':
            quotation.not_approved_reason_remark = not_approved_reason_remark
        else:
            quotation.not_approved_reason_remark = None
        quotation.save()
        
        if status == 'Not Approved' and not was_not_approved:
            serializer = self.get_serializer(quotation)
            serializer.send_not_approved_notification(quotation, quotation.assigned_sales_person)
        
        serializer = self.get_serializer(quotation)
        return Response(serializer.data)
    
    
class QuotationTermsViewSet(viewsets.ModelViewSet):
    queryset = QuotationTerms.objects.all()
    serializer_class = QuotationTermsSerializer
    permission_classes = [AllowAny]

    # REMOVED all singleton logic - now supports multiple terms instances
    # Each quotation can have its own terms

    # Optional: Keep this for backward compatibility if needed
    @action(detail=False, methods=['get'], url_path='latest')
    def get_latest_terms(self, request):
        """Get the most recent terms (for template purposes only)"""
        latest_terms = QuotationTerms.objects.order_by('-updated_at').first()
        if latest_terms:
            serializer = self.get_serializer(latest_terms)
            return Response(serializer.data)
        return Response({"id": None, "content": "", "updated_at": None})

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        quotation_id = self.request.query_params.get('quotation_id')
        if quotation_id:
            queryset = queryset.filter(quotation_id=quotation_id).prefetch_related('items')
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        series_number = instance.series_number
        self.perform_destroy(instance)
        if series_number and series_number.startswith('PO-PRIME'):
            sequence = int(series_number.split('-')[-1])
            subsequent_pos = PurchaseOrder.objects.filter(
                series_number__startswith='PO-PRIME',
                series_number__gt=series_number
            ).order_by('series_number')
            for po in subsequent_pos:
                current_sequence = int(po.series_number.split('-')[-1])
                new_sequence = current_sequence - 1
                while PurchaseOrder.objects.filter(series_number=f"PO-PRIME-{new_sequence:06d}").exists():
                    new_sequence += 1
                po.series_number = f"PO-PRIME-{new_sequence:06d}"
                po.save()
        quotation = instance.quotation
        if not quotation.purchase_orders.exists():
            quotation.quotation_status = 'Approved'
            quotation.save()
        return Response(status=204)

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        purchase_order = self.get_object()
        status = request.data.get('status')
        valid_statuses = [choice[0] for choice in PurchaseOrder._meta.get_field('status').choices]
        if status not in valid_statuses:
            return Response({"detail": "Invalid status"}, status=400)
        purchase_order.status = status
        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)