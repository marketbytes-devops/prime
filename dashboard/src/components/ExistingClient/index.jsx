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
    address: rfqData.company_address || "",
    phone: rfqData.company_phone || "",
    email: rfqData.company_email || "",
    rfq_channel: rfqData.rfq_channel || "",
    rfq_channel_name: "",
    point_of_contact_name: rfqData.point_of_contact_name || "",
    point_of_contact_phone: rfqData.point_of_contact_phone || "",
    point_of_contact_email: rfqData.point_of_contact_email || "",
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
          apiClient.get("/rfqs/"),
          apiClient.get("/channels/"),
        ]);
        const clientData = Array.isArray(clientsResponse.data)
          ? clientsResponse.data
          : clientsResponse.data.results || [];
        setClients(clientData);
        setFilteredClients(
          clientData.sort((a, b) => a.company_name.localeCompare(b.company_name))
        );
        setRfqChannels(channelsResponse.data || []);
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
    if (selectedClient && rfqChannels.length > 0) {
      const channel = rfqChannels.find(
        (ch) => ch.id === parseInt(selectedClient.rfq_channel)
      );
      setFormData({
        company_name: selectedClient.company_name || "",
        address: selectedClient.company_address || "",
        phone: selectedClient.company_phone || "",
        email: selectedClient.company_email || "",
        rfq_channel: selectedClient.rfq_channel || "",
        rfq_channel_name: channel ? channel.channel_name : "No channel selected",
        point_of_contact_name: selectedClient.point_of_contact_name || "",
        point_of_contact_phone: selectedClient.point_of_contact_phone || "",
        point_of_contact_email: selectedClient.point_of_contact_email || "",
      });
    }
  }, [selectedClient, rfqChannels]);

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
      rfq_channel_name: "",
      point_of_contact_name: "",
      point_of_contact_phone: "",
      point_of_contact_email: "",
    });
    setSearchQuery("");
    navigate("/add-rfq"); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { point_of_contact_email } = formData;
    if (point_of_contact_email && !/\S+@\S+\.\S+/.test(point_of_contact_email)) {
      toast.error("Point of Contact Email is invalid.");
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
        company_address: formData.address,
        company_phone: formData.phone,
        company_email: formData.email,
        rfq_channel: formData.rfq_channel,
        point_of_contact_name: formData.point_of_contact_name || null,
        point_of_contact_phone: formData.point_of_contact_phone || null,
        point_of_contact_email: formData.point_of_contact_email || null,
      };

      await apiClient.put(`/rfqs/${selectedClient.id}/`, payload);
      toast.success("Point of Contact updated successfully!");
      navigate("/view-rfq"); 
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
              Choose Client
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
                className="flex-grow p-2 border border-gray-400 rounded-l focus:outline-indigo-600 focus:ring focus:border-indigo-600 text-sm"
              />
            </div>
            {showDropdown && searchQuery && (
              filteredClients.length ? (
                <ul className="absolute z-10 w-full max-w-md bg-white shadow-lg border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <li
                      key={client.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleClientSelect(client)}
                    >
                      {client.company_name} (ID: {client.id})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2 text-sm">No clients found.</p>
              )
            )}
          </div>
        )}

        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {selectedClient && (
          <div>
            <div className="flex justify-end mb-2">
              <button
                onClick={handleCloseClientForm}
                className="text-gray-600 hover:text-gray-900 text-lg font-bold"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { name: "company_name", label: "Company Name" },
                  { name: "address", label: "Company Address" },
                  { name: "phone", label: "Phone Number" },
                  { name: "email", label: "Company Email", type: "email" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600">{field.label}</label>
                    <input
                      type={field.type || "text"}
                      value={formData[field.name] || ""}
                      disabled
                      className="mt-1 p-2 border border-gray-300 rounded bg-gray-100 text-black cursor-not-allowed text-sm"
                    />
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-4">RFQ Channel</h3>
              <div className="mb-6">
                <input
                  type="text"
                  value={formData.rfq_channel_name || "No channel selected"}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded bg-gray-50 text-gray-700 cursor-not-allowed text-sm"
                  placeholder="Channel Name"
                />
              </div>

              <h3 className="text-lg font-semibold mb-4">Point of Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "point_of_contact_name", label: "Contact Name" },
                  { name: "point_of_contact_phone", label: "Contact Phone" },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className="mt-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200"
                      placeholder={`Enter ${field.label}`}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-medium text-gray-600">Contact Email</label>
                  <input
                    type="email"
                    name="point_of_contact_email"
                    value={formData.point_of_contact_email || ""}
                    onChange={handleInputChange}
                    className="mt-2 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200"
                    placeholder="Enter Contact Email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? "Saving..." : "Save Contact"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExistingClient;