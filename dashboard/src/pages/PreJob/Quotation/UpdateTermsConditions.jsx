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
        const apiContent = res.data?.content?.trim();
        setContent(apiContent || DEFAULT_TERMS_HTML);
        setTermsId(res.data?.id || null);
      } else {
        const res = await apiClient.get(`/quotations/${quotationId}/`);
        const quotation = res.data;
        setQuotationData(quotation);

        const customContent = quotation.terms?.content?.trim();
        setContent(customContent || DEFAULT_TERMS_HTML);   
        setTermsId(quotation.terms?.id || null);
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
    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Terms cannot be empty");
      return;
    }
    try {
      if (quotationId) {
        await apiClient.patch(`/quotations/${quotationId}/update-terms/`, {
          content,
        });
      } else {
        if (termsId) {
          await apiClient.patch(`/quotation-terms/${termsId}/`, { content });
        } else {
          const res = await apiClient.post("/quotation-terms/", { content });
          setTermsId(res.data.id);
        }
      }
      toast.success("Terms & Conditions saved successfully!");
      setIsEdit(false);
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
      </div>

      {isEdit ? (
        <>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className="mb-4"
            style={{ height: "500px" }}
          />
          <div className="mt-20 flex gap-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save Terms
            </button>
            <button
              onClick={() => setIsEdit(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="prose max-w-none border p-6 rounded bg-white min-h-96 shadow-sm"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          <div className="mt-6">
            <button
              onClick={() => setIsEdit(true)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Edit Terms
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UpdateTermsAndConditions;