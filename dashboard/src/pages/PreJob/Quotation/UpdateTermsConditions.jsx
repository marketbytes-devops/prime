import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { DEFAULT_TERMS_HTML } from "../../../constants/defaultTerms";

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
        if (res.data?.content) {
          setContent(res.data.content);
          setTermsId(res.data.id);
        } else {
          setContent(DEFAULT_TERMS_HTML); 
          setTermsId(null);
        }
        setLoading(false);
        return;
      }

      const res = await apiClient.get(`/quotations/${quotationId}/`);
      const quotation = res.data;
      setQuotationData(quotation);

      if (quotation.terms && quotation.terms.content) {
        setContent(quotation.terms.content);
        setTermsId(quotation.terms.id);
      } else {
        setContent(DEFAULT_TERMS_HTML);
        setTermsId(null);
      }
    } catch (e) {
      console.error("Failed to load terms:", e);
      toast.error("Failed to load terms and conditions");
      setContent(DEFAULT_TERMS_HTML);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationWithTerms();
  }, [quotationId]);

  const handleSave = async () => {
    const cleaned = content.replace(/<(.|\n)*?>/g, "").trim();
    if (!cleaned) {
      toast.error("Terms & Conditions cannot be empty");
      return;
    }

    try {
      let newTermsId = termsId;

      if (!termsId) {
        const res = await apiClient.post("/quotation-terms/", { content });
        newTermsId = res.data.id;
      } else {
        await apiClient.patch(`/quotation-terms/${termsId}/`, { content });
      }

      if (quotationId) {
        await apiClient.patch(`/quotations/${quotationId}/update-terms/`, {
          content: content,
        });
      }

      toast.success(
        quotationId
          ? "Quotation terms updated successfully!"
          : "Global template updated successfully!"
      );

      setIsEdit(false);
      setTermsId(newTermsId);
      await fetchQuotationWithTerms(); 
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Failed to save terms");
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Revert to default template? This cannot be undone.")) {
      setContent(DEFAULT_TERMS_HTML);
      setTermsId(null);
      toast.info("Reset to default template");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "align",
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading terms...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? "Edit" : "View"} Terms & Conditions
          {quotationId && quotationData && (
            <span className="text-lg font-normal text-gray-600 ml-3">
              — Quotation #{quotationData.series_number}
            </span>
          )}
        </h1>

        <div className="flex items-center gap-3 text-sm">
          {quotationId && (
            <span
              className={`px-3 py-1 rounded-full text-white ${
                quotationData?.terms ? "bg-green-600" : "bg-gray-500"
              }`}
            >
              {quotationData?.terms ? "Custom Terms" : "Using Default Template"}
            </span>
          )}
        </div>
      </div>
      {!isEdit ? (
        <div className="space-y-6">
          <div
            className="prose prose-lg max-w-none border border-gray-200 rounded-lg p-8 bg-white shadow-sm"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsEdit(true)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {quotationId ? "Edit Quotation Terms" : "Edit Global Template"}
            </button>

            {quotationId && termsId && (
              <button
                onClick={handleResetToDefault}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Revert to Default Template
              </button>
            )}

            {quotationId && (
              <button
                onClick={() => navigate("/view-quotation")}
                className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Back to Quotations
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Edit your terms and conditions..."
            className="bg-white"
            style={{ minHeight: "500px" }}
          />

          <div className="flex flex-wrap gap-3 pt-12">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm("Discard changes and cancel editing?")
                ) {
                  setIsEdit(false);
                  fetchQuotationWithTerms(); 
                }
              }}
              className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            {quotationId && termsId && (
              <button
                onClick={handleResetToDefault}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
              >
                Reset to Default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTermsAndConditions;