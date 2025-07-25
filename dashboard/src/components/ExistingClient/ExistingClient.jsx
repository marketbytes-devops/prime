import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../helpers/apiClient";
import { toast } from "react-toastify";

const ExistingClient = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rfqData = {}, rfqId } = location.state || {};

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [rfqChannels, setRfqChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(rfqId ? rfqData : null);
  const [formData, setFormData] = useState({
    company_name: rfqData.company_name || "",
    address: rfqData.address || "",
    phone: rfqData.phone || "",
    email: rfqData.email || "",
    rfq_channel: rfqData.rfq_channel || "",
    attention_name: rfqData.attention_name || "",
    attention_phone: rfqData.attention_phone || "",
    attention_email: rfqData.attention_email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const [clientsResponse, channelsResponse] = await Promise.all([
          apiClient.get("/add-rfqs/"),
          apiClient.get("/rfq-channels/"),
        ]);
        const clientData = Array.isArray(clientsResponse.data)
          ? clientsResponse.data
          : clientsResponse.data.results || [];
        setClients(clientData);
        setFilteredClients(
          clientData.sort((a, b) =>
            a.company_name.localeCompare(b.company_name)
          )
        );
        setRfqChannels(
          channelsResponse.data.map((channel) => channel.channel_name)
        );
        setError(null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load clients or RFQ channels.");
        toast.error("Failed to load clients or RFQ channels.");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients
      .filter((client) =>
        client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a.company_name.localeCompare(b.company_name));
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  useEffect(() => {
    if (selectedClient) {
      setFormData({
        company_name: selectedClient.company_name || "",
        address: selectedClient.address || "",
        phone: selectedClient.phone || "",
        email: selectedClient.email || "",
        rfq_channel: selectedClient.rfq_channel || "",
        attention_name: selectedClient.attention_name || "",
        attention_phone: selectedClient.attention_phone || "",
        attention_email: selectedClient.attention_email || "",
      });
    }
  }, [selectedClient]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseClientForm = () => {
    setSelectedClient(null);
    setFormData({
      company_name: "",
      address: "",
      phone: "",
      email: "",
      rfq_channel: "",
      attention_name: "",
      attention_phone: "",
      attention_email: "",
    });
    setSearchQuery("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { attention_email, attention_phone, attention_name } = formData;
    if (attention_email && !/\S+@\S+\.\S+/.test(attention_email)) {
      toast.error("Attention Email is invalid.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedClient?.id) {
      toast.error("Please select a client first.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...selectedClient,
        attention_name: attention_name || null,
        attention_phone: attention_phone || null,
        attention_email: attention_email || null,
      };

      await apiClient.put(`/add-rfqs/${selectedClient.id}/`, payload);
      toast.success("Point of Contact updated successfully!");
      navigate("/pre-job/view-rfq");
    } catch (error) {
      console.error("Failed to update Point of Contact:", error);
      toast.error("Failed to update Point of Contact.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-4">
        {!selectedClient && (
          <div className="mb-4 relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Client
            </label>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="flex-grow p-2 border border-gray-400 rounded-l focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
              />
            </div>

            {showDropdown &&
              searchQuery &&
              (filteredClients.length > 0 ? (
                <ul className="absolute z-10 w-full max-w-md bg-white border border-gray-400 rounded mt-1 max-h-40 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <li
                      key={client.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      {client.company_name} (ID: {client.id})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 mt-2">No clients found.</p>
              ))}
          </div>
        )}

        {loading && <p>Loading clients...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {selectedClient && !loading && (
          <div>
            <div className="flex justify-end mb-2">
              <button
                onClick={handleCloseClientForm}
                className="text-gray-600 hover:text-gray-900 font-bold text-xl"
                aria-label="Close client form"
              >
                &#x2715;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-medium mt-4 mb-2">Client Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { name: "company_name", label: "Company Name" },
                  { name: "address", label: "Company Address" },
                  { name: "phone", label: "Company Phone" },
                  { name: "email", label: "Company Email", type: "email" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={formData[field.name] || ""}
                      readOnly
                      disabled
                      className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-gray-800 cursor-not-allowed text-sm"
                    />
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">RFQ Channel</h3>
              <div className="mb-6">
                <input
                  type="text"
                  value={formData.rfq_channel || ""}
                  readOnly
                  disabled
                  className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-800 cursor-not-allowed text-sm"
                />
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">Point of Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "attention_name", label: "Name" },
                  { name: "attention_phone", label: "Phone" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                      placeholder={`Enter ${field.label}`}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="attention_email"
                    value={formData.attention_email || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-500 text-sm"
                    placeholder="Enter Email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400"
              >
                {isSubmitting ? "Saving..." : "Save Point of Contact"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExistingClient;
