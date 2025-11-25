import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const UpdateTermsAndConditions = () => {
  const navigate = useNavigate();
  const { quotationId } = useParams(); 
  const [content, setContent] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [termsId, setTermsId] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  const fetchQuotationWithTerms = async () => {
    try {
      setLoading(true);

      if (!quotationId) {
        const res = await apiClient.get("/quotation-terms/latest/");
        setContent(res.data.content || "");
        setTermsId(res.data.id || null);
        setLoading(false);
        return;
      }

      const res = await apiClient.get(`/quotations/${quotationId}/`);
      const quotation = res.data;
      setQuotationData(quotation);

      if (quotation.terms && quotation.terms.content) {
        setContent(quotation.terms.content);
        setTermsId(quotation.terms.id);
      }
      else {
        const DEFAULT_TERMS = `
          <h3>Terms & Conditions</h3>
          <h4>Calibration Service General Terms and Conditions</h4>
          <p><strong>• Comprehensive Calibration Reports:</strong> Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.</p>
          <p><strong>• Tolerance Limits:</strong> Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer’s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.</p>
          <p><strong>• Defective Units:</strong> If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.</p>
          <p><strong>• Calibration Methods:</strong> Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.</p>
          <p><strong>• Turnaround Time:</strong> Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.</p>
          <p><strong>• Pick-up and Delivery:</strong> Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.</p>
          <p><strong>• Purchase Order Requirement:</strong> Customers purchase order or written approval is required to start calibration.</p>
          <p><strong>• Partial Invoicing:</strong> Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.</p>
          <p><strong>• Out of Tolerance Units:</strong> If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.</p>
          <p><strong>• Conformity Statement:</strong> Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.</p>
          <p><strong>• PAYMENT:</strong> Payment to be made after 30 days</p>
          <p><strong>• CONFIDENTIALITY:</strong> Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.</p>
          <p><strong>• VAT:</strong> VAT is excluded from our quotation and will be charged at 15% extra.</p>
          <p><strong>For Prime Innovation Company<br>Hari Krishnan M<br>Head - Engineering and QA/QC</strong></p>
        `;
        setContent(DEFAULT_TERMS);
        setTermsId(null); 
      }
    } catch (e) {
      console.error("Failed to load terms:", e);
      toast.error("Failed to load terms and conditions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationWithTerms();
  }, [quotationId]);

  const handleSave = async () => {
    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Terms cannot be empty");
      return;
    }

    try {
      let termsInstance = null;

      if (termsId) {
        await apiClient.patch(`/quotation-terms/${termsId}/`, { content });
      } else {
        const res = await apiClient.post("/quotation-terms/", { content });
        termsInstance = res.data;
      }

      await apiClient.patch(`/quotations/${quotationId}/update-terms/`, {
        content: content,
      });

      toast.success("Terms & Conditions saved successfully!");
      setIsEdit(false);
      await fetchQuotationWithTerms(); 
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Failed to save terms");
    }
  };


  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
  ];

  if (loading) return <div className="p-4"></div>;

  return (
    <div className="mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit" : "View"} Terms & Conditions
          {quotationId && quotationData && (
            <span className="text-sm text-gray-600 ml-2">
              - Quotation #{quotationData.series_number}
            </span>
          )}
        </h1>

        {quotationId && (
          <div className="text-sm text-gray-600">
            {quotationData?.terms ? "Custom Terms" : "Using Template"}
          </div>
        )}
      </div>

      {isEdit ? (
        <>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Write your terms and conditions here..."
            className="mb-4"
            style={{ height: "400px" }}
          />

          <div className="mt-16 flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {quotationId
                ? "Update Quotation Terms"
                : "Update Global Template"}
            </button>
            <button
              onClick={() => setIsEdit(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="prose max-w-none border p-4 rounded bg-gray-50 min-h-48"
            dangerouslySetInnerHTML={{
              __html: content || "<em>No terms set yet.</em>",
            }}
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsEdit(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {quotationId ? "Edit Quotation Terms" : "Edit Global Template"}
            </button>

            {quotationId && (
              <button
                onClick={() => navigate(`/view-quotation/`)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back to Quotation
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UpdateTermsAndConditions;
