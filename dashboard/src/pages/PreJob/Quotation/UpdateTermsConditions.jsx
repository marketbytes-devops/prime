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
  const [quotationData, setQuotationData] = useState(null);
  const [isDefaultTerms, setIsDefaultTerms] = useState(true);
  const [termsId, setTermsId] = useState(null);

  const DEFAULT_TERMS = `
<h3 style="text-align: center; margin: 40px 0 20px; font-weight: bold; font-size: 18px;">
  Terms & Conditions
</h3>
<h4 style="margin-bottom: 20px; font-weight: bold;">
  Calibration Service General Terms and Conditions
</h4>

<ul style="list-style-type: disc; padding-left: 25px; line-height: 1.9; font-size: 14px;">
  <li>Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.</li>
  
  <li>Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer's tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.</li>
  
  <li>If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation's services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.</li>
  
  <li>Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument's service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.</li>
  
  <li>Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.</li>
  
  <li>Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.</li>
  
  <li>Customers purchase order or written approval is required to start calibration.</li>
  
  <li>Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.</li>
  
  <li>If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.</li>
  
  <li>Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.</li>
  
  <li><strong>PAYMENT:</strong> Payment to be made after 30 days</li>
  
  <li><strong>CONFIDENTIALITY:</strong> Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer's equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.</li>
  
  <li><strong>VAT is excluded from our quotation and will be charged at 15% extra.</strong></li>
</ul>

<div style="margin-top: 60px; text-align: right; font-weight: bold; font-size: 15px;">
  For Prime Innovation Company<br>
  Hari Krishnan M<br>
  <em style="font-size: 14px;">Head - Engineering and QA/QC</em>
</div>
`.trim();

  const fetchQuotationWithTerms = async () => {
    try {
      setLoading(true);

      if (!quotationId) {
        // Editing default terms (global)
        try {
          const res = await apiClient.get("/terms/default-terms/");
          setContent(res.data?.content?.trim() || DEFAULT_TERMS);
          setTermsId(res.data?.id || null);
          setIsDefaultTerms(true);
        } catch (error) {
          console.warn("No default terms found, using fallback");
          setContent(DEFAULT_TERMS);
          setIsDefaultTerms(true);
        }
      } else {
        // Editing terms for a specific quotation
        const res = await apiClient.get(`/quotations/${quotationId}/`);
        const quotation = res.data;
        setQuotationData(quotation);

        if (quotation.has_custom_terms && quotation.terms) {
          // Quotation has custom terms
          setContent(quotation.terms.content || DEFAULT_TERMS);
          setTermsId(quotation.terms.id);
          setIsDefaultTerms(false);
        } else {
          // Quotation uses default terms - fetch from backend
          try {
            const defaultRes = await apiClient.get("/terms/default-terms/");
            setContent(defaultRes.data?.content?.trim() || DEFAULT_TERMS);
            setTermsId(defaultRes.data?.id || null);
          } catch (error) {
            console.warn("Failed to fetch default terms, using fallback");
            setContent(DEFAULT_TERMS);
          }
          setIsDefaultTerms(true);
        }
      }
    } catch (e) {
      console.error("Failed to load terms:", e);
      toast.error("Failed to load terms and conditions");
      setContent(DEFAULT_TERMS);
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
      if (quotationId) {
        // Save custom terms for a specific quotation
        await apiClient.post(`/quotations/${quotationId}/update-terms/`, {
          content: content,
        });
        setIsDefaultTerms(false);
        toast.success("Custom terms saved successfully!");
      } else {
        // Save default terms (global)
        try {
          const defaultRes = await apiClient.get("/terms/default-terms/");
          const defaultTermsId = defaultRes.data.id;

          await apiClient.patch(`/terms/${defaultTermsId}/`, {
            content: content,
          });
          toast.success("Default terms updated successfully!");
        } catch (error) {
          // If no default exists, create one
          await apiClient.post("/terms/", {
            content: content,
            is_default: true,
          });
          toast.success("Default terms created successfully!");
        }
      }

      setIsEdit(false);
      fetchQuotationWithTerms();
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Failed to save terms");
    }
  };

  const handleResetToDefault = async () => {
    if (!quotationId) {
      toast.error("Cannot reset default terms");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to reset to default terms? This will delete custom terms for this quotation."
      )
    ) {
      return;
    }

    try {
      await apiClient.post(`/quotations/${quotationId}/reset-to-default-terms/`);

      // Refresh with default terms
      const defaultRes = await apiClient.get("/terms/default-terms/");
      setContent(defaultRes.data?.content?.trim() || DEFAULT_TERMS);
      setIsDefaultTerms(true);
      setIsEdit(false);

      toast.success("Reset to default terms successfully!");
      fetchQuotationWithTerms();
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset terms");
    }
  };

  const handleBack = () => {
    navigate(-1);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Terms & Conditions
            </h1>
            {quotationId && quotationData && (
              <p className="text-gray-600 mt-1">
                Quotation #{quotationData.series_number} -{" "}
                {quotationData.company_name}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {quotationId && !isEdit && (
              <button
                onClick={handleResetToDefault}
                disabled={isDefaultTerms}
                className={`px-4 py-2 rounded-md ${
                  isDefaultTerms
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Reset to Default
              </button>
            )}
            {!isEdit && (
              <button
                onClick={() => setIsEdit(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Edit Terms
              </button>
            )}
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        </div>

        <div className="mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isDefaultTerms
                ? "bg-green-100 text-green-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {isDefaultTerms
              ? quotationId
                ? "Using Default Terms"
                : "Editing Default Terms"
              : "Using Custom Terms"}
          </span>
        </div>

        {isEdit ? (
          <>
            <div className="mb-6" style={{ paddingBottom: "60px" }}>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                style={{ height: "500px" }}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {quotationId ? "Save Custom Terms" : "Save as Default"}
              </button>
              <button
                onClick={() => {
                  setIsEdit(false);
                  fetchQuotationWithTerms();
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="prose max-w-none border p-6 rounded bg-white min-h-96 shadow-sm ql-editor"
              dangerouslySetInnerHTML={{
                __html:
                  content ||
                  '<p class="text-gray-500">No terms content available</p>',
              }}
            />
            <div className="mt-6 text-sm text-gray-600">
              <p className="font-medium mb-2">Note:</p>
              <ul className="list-disc pl-5 space-y-1">
                {quotationId ? (
                  <>
                    <li>
                      These terms will be used when printing this quotation
                    </li>
                    <li>
                      Click "Edit Terms" to create custom terms for this
                      quotation
                    </li>
                    <li>
                      Click "Reset to Default" to revert to company default
                      terms
                    </li>
                    <li>
                      Custom terms override default terms for this quotation
                      only
                    </li>
                  </>
                ) : (
                  <>
                    <li>These are the default terms for all quotations</li>
                    <li>Changes here will affect all new quotations</li>
                    <li>
                      Existing quotations with custom terms will not be affected
                    </li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateTermsAndConditions;