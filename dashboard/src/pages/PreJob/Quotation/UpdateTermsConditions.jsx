import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const UpdateTermsAndConditions = () => {
  const navigate = useNavigate();
  const { quotationId } = useParams(); // Get quotation ID from URL
  const [content, setContent] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [termsId, setTermsId] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  // Fetch quotation data including its terms
  const fetchQuotationWithTerms = async () => {
    try {
      if (!quotationId) {
        // If no quotation ID, this might be for global template
        const res = await apiClient.get("/quotation-terms/latest/");
        const data = res.data;
        setContent(data.content || "");
        setTermsId(data.id || null);
        setLoading(false);
        return;
      }

      // Fetch specific quotation with its terms
      const res = await apiClient.get(`/quotations/${quotationId}/`);
      const quotation = res.data;
      setQuotationData(quotation);

      if (quotation.terms) {
        setContent(quotation.terms.content || "");
        setTermsId(quotation.terms.id || null);
      } else {
        setContent("");
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
      if (quotationId) {
        // Update terms for specific quotation
        await apiClient.patch(`/quotations/${quotationId}/`, {
          terms: {
            content: content,
          },
        });
        toast.success("Terms updated for this quotation");
      } else {
        // Global terms update (template)
        const payload = { content };
        if (termsId) {
          await apiClient.patch(`/quotation-terms/${termsId}/`, payload);
          toast.success("Global terms template updated");
        } else {
          const res = await apiClient.post(`/quotation-terms/`, payload);
          setTermsId(res.data.id);
          toast.success("Global terms template created");
        }
      }

      setIsEdit(false);
      // Refresh data
      await fetchQuotationWithTerms();
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Failed to save terms");
    }
  };

  const handleCloneFromTemplate = async () => {
    try {
      // Get latest global template
      const templateRes = await apiClient.get("/quotation-terms/latest/");
      if (templateRes.data && templateRes.data.content) {
        setContent(templateRes.data.content);
        toast.success("Loaded template terms");
      } else {
        toast.info("No template terms available");
      }
    } catch (e) {
      console.error("Clone error:", e);
      toast.error("Failed to load template");
    }
  };

  const handleRemoveTerms = async () => {
    if (!quotationId) return;

    try {
      await apiClient.delete(`/quotations/${quotationId}/remove-terms/`);
      setContent("");
      setTermsId(null);
      toast.success("Terms removed from quotation");
      setIsEdit(false);
    } catch (e) {
      console.error("Remove error:", e);
      toast.error("Failed to remove terms");
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

  if (loading) return <div className="p-4">Loading...</div>;

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
          {/* Template Actions */}
          {quotationId && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleCloneFromTemplate}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                type="button"
              >
                Load Template
              </button>
              {termsId && (
                <button
                  onClick={handleRemoveTerms}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  type="button"
                >
                  Remove Terms
                </button>
              )}
            </div>
          )}

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
