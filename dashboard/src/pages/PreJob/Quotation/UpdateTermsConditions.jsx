import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../helpers/apiClient";
import Button from "../../../components/Button";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const UpdateTermsAndConditions = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [termsId, setTermsId] = useState(null); 

  const fetchTerms = async () => {
    try {
      const res = await apiClient.get("/quotation-terms/");
      const data = res.data;
      setContent(data.content || "");
      setTermsId(data.id || null);
    } catch (e) {
      toast.error("Failed to load terms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleSave = async () => {
    if (!content.trim() || content === "<p><br></p>") {
      toast.error("Terms cannot be empty");
      return;
    }

    try {
      const payload = { content };

      if (termsId) {
        await apiClient.patch(`/quotation-terms/update/`, payload);
        toast.success("Terms updated");
      } else {
        const res = await apiClient.post(`/quotation-terms/`, payload);
        setTermsId(res.data.id);
        toast.success("Terms created");
      }

      setIsEdit(false);
      navigate("/view-quotation");
    } catch (e) {
      console.error(e);
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
    "bold", "italic", "underline", "strike",
    "color", "background",
    "list", "bullet",
    "indent",
    "align",
    "link", "image",
  ];

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? "Edit" : "View"} Terms & Conditions
      </h1>

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
            <Button
              onClick={handleSave}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Update
            </Button>
            <Button
              onClick={() => setIsEdit(false)}
              className="bg-gray-400 text-white hover:bg-gray-500"
            >
              Cancel
            </Button>
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

          <Button
            onClick={() => setIsEdit(true)}
            className="mt-4 bg-green-600 text-white hover:bg-green-700"
          >
            Edit
          </Button>
        </>
      )}
    </div>
  );
};

export default UpdateTermsAndConditions;