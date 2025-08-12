import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  FilePlus,
  FileText,
  ListOrdered,
  Wrench,
  User,
  Settings,
  Package,
  Ruler,
  Users,
  MessageSquareQuote,
  CheckSquare,
  Truck,
  Archive,
  FileSearch,
  MessagesSquare,
  ClipboardList,
  FileCheck,
  Shield,
  Search,
  File,
  FilePlus2,
  List,
  CheckCircle,
  Users2,
  ShieldCheck,
  Lock,
  FolderKanban
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/images/img-logo.png";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [isPreJobOpen, setIsPreJobOpen] = useState(false);
  const [isJobExecutionOpen, setIsJobExecutionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [isInitiateWorkOrderOpen, setIsInitiateWorkOrderOpen] = useState(false);
  const [isProcessingWorkOrdersOpen, setIsProcessingWorkOrdersOpen] = useState(false);
  const [isPostJobPhaseOpen, setIsPostJobPhaseOpen] = useState(false);
  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);

  useEffect(() => {
    const preJobPaths = ["/add-rfq", "/view-rfq", "/view-quotation"];
    const jobExecutionPaths = [
      "/job-execution/initiate-work-order/list-all-purchase-orders",
      "/job-execution/initiate-work-order/add-wo-without-po",
      "/job-execution/processing-work-orders/list-all-processing-work-orders",
      "/job-execution/processing-work-orders/manager-approval",
      "/job-execution/processing-work-orders/delivery",
      "/job-execution/processing-work-orders/close-work-orders",
    ];
    const settingsPaths = [
      "/additional-settings/add-rfq-channel",
      "/additional-settings/add-item",
      "/additional-settings/add-unit",
      "/additional-settings/add-team",
      "/additional-settings/add-series",
    ];
    const rfqPaths = ["/add-rfq", "/view-rfq"];
    const initiateWorkOrderPaths = [
      "/job-execution/initiate-work-order/list-all-purchase-orders",
      "/job-execution/initiate-work-order/add-wo-without-po",
    ];
    const processingWorkOrdersPaths = [
      "/job-execution/processing-work-orders/list-all-processing-work-orders",
      "/job-execution/processing-work-orders/manager-approval",
      "/job-execution/processing-work-orders/delivery",
      "/job-execution/processing-work-orders/close-work-orders",
    ];
    const postJobPhasePaths = [
      "/post-job-phase/pending-invoices",
      "/post-job-phase/completed-wo",
    ];
    const userRolesPaths = [
      "/user-roles/users",
      "/user-roles/roles",
      "/user-roles/permissions",
    ];

    setIsPreJobOpen(preJobPaths.includes(location.pathname));
    setIsJobExecutionOpen(jobExecutionPaths.includes(location.pathname));
    setIsSettingsOpen(settingsPaths.includes(location.pathname));
    setIsRFQOpen(rfqPaths.includes(location.pathname));
    setIsInitiateWorkOrderOpen(initiateWorkOrderPaths.includes(location.pathname));
    setIsProcessingWorkOrdersOpen(processingWorkOrdersPaths.includes(location.pathname));
    setIsPostJobPhaseOpen(postJobPhasePaths.includes(location.pathname));
    setIsUserRolesOpen(userRolesPaths.includes(location.pathname));
  }, [location.pathname]);

  const togglePreJob = () => {
    setIsPreJobOpen(!isPreJobOpen);
    setIsJobExecutionOpen(false);
    setIsSettingsOpen(false);
    setIsPostJobPhaseOpen(false);
    setIsUserRolesOpen(false);
  };

  const toggleJobExecution = () => {
    setIsJobExecutionOpen(!isJobExecutionOpen);
    setIsPreJobOpen(false);
    setIsSettingsOpen(false);
    setIsPostJobPhaseOpen(false);
    setIsUserRolesOpen(false);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setIsPreJobOpen(false);
    setIsJobExecutionOpen(false);
    setIsPostJobPhaseOpen(false);
    setIsUserRolesOpen(false);
  };

  const togglePostJobPhase = () => {
    setIsPostJobPhaseOpen(!isPostJobPhaseOpen);
    setIsPreJobOpen(false);
    setIsJobExecutionOpen(false);
    setIsSettingsOpen(false);
    setIsUserRolesOpen(false);
  };

  const toggleUserRoles = () => {
    setIsUserRolesOpen(!isUserRolesOpen);
    setIsPreJobOpen(false);
    setIsJobExecutionOpen(false);
    setIsSettingsOpen(false);
    setIsPostJobPhaseOpen(false);
  };

  const toggleRFQ = () => setIsRFQOpen(!isRFQOpen);
  const toggleInitiateWorkOrder = () => setIsInitiateWorkOrderOpen(!isInitiateWorkOrderOpen);
  const toggleProcessingWorkOrders = () => setIsProcessingWorkOrdersOpen(!isProcessingWorkOrdersOpen);

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  const menuItems = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    {
      label: "Pre-Job",
      icon: <FileText className="w-5 h-5 mr-3" />,
      subItems: [
        {
          label: "RFQ",
          icon: <FileSearch className="w-5 h-5 mr-3" />,
          subItems: [
            { to: "/add-rfq", label: "Add RFQ", icon: <FilePlus className="w-5 h-5 mr-3" /> },
            { to: "/view-rfq", label: "View RFQ", icon: <Search className="w-5 h-5 mr-3" /> },
          ],
        },
        { to: "/view-quotation", label: "Quotation", icon: <MessageSquareQuote className="w-5 h-5 mr-3" /> },
      ],
    },
    {
      label: "Job Execution",
      icon: <Wrench className="w-5 h-5 mr-3" />,
      subItems: [
        {
          label: "Initiate Work Order",
          icon: <ListOrdered className="w-5 h-5 mr-3" />,
          subItems: [
            { to: "/job-execution/initiate-work-order/list-all-purchase-orders", label: "List Purchase Orders", icon: <File className="w-5 h-5 mr-3" /> },
            { to: "/job-execution/initiate-work-order/add-wo-without-po", label: "Add WO Without PO", icon: <FilePlus2 className="w-5 h-5 mr-3" /> },
          ],
        },
        {
          label: "Processing Work Orders",
          icon: <FolderKanban className="w-5 h-5 mr-3" />,
          subItems: [
            { to: "/job-execution/processing-work-orders/list-all-processing-work-orders", label: "List Processing WO", icon: <List className="w-5 h-5 mr-3" /> },
            { to: "/job-execution/processing-work-orders/manager-approval", label: "Manager Approval", icon: <CheckCircle className="w-5 h-5 mr-3" /> },
            { to: "/job-execution/processing-work-orders/delivery", label: "Delivery", icon: <Truck className="w-5 h-5 mr-3" /> },
            { to: "/job-execution/processing-work-orders/close-work-orders", label: "Close Work Order", icon: <Archive className="w-5 h-5 mr-3" /> },
          ],
        },
      ],
    },
    {
      label: "Post Job Phase",
      icon: <ClipboardList className="w-5 h-5 mr-3" />,
      subItems: [
        { to: "/post-job-phase/pending-invoices", label: "Pending Invoices", icon: <FileCheck className="w-5 h-5 mr-3" /> },
        { to: "/post-job-phase/completed-wo", label: "Completed WO", icon: <CheckSquare className="w-5 h-5 mr-3" /> },
      ],
    },
    { to: "/profile", label: "Profile", icon: <User className="w-5 h-5 mr-3" /> },
    {
      label: "Additional Settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      subItems: [
        { to: "/additional-settings/add-series", label: "Series", icon: <ListOrdered className="w-5 h-5 mr-3" /> },
        { to: "/additional-settings/add-rfq-channel", label: "RFQ Channel", icon: <MessagesSquare className="w-5 h-5 mr-3" /> },
        { to: "/additional-settings/add-item", label: "Item", icon: <Package className="w-5 h-5 mr-3" /> },
        { to: "/additional-settings/add-unit", label: "Unit", icon: <Ruler className="w-5 h-5 mr-3" /> },
        { to: "/additional-settings/add-team", label: "Team", icon: <Users2 className="w-5 h-5 mr-3" /> },
      ],
    },
    {
      label: "User Roles",
      icon: <Shield className="w-5 h-5 mr-3" />,
      subItems: [
        { to: "/user-roles/users", label: "Users", icon: <Users className="w-5 h-5 mr-3" /> },
        { to: "/user-roles/roles", label: "Roles", icon: <ShieldCheck className="w-5 h-5 mr-3" /> },
        { to: "/user-roles/permissions", label: "Permissions", icon: <Lock className="w-5 h-5 mr-3" /> },
      ],
    },
  ];

  return (
    <motion.div
      className="fixed top-0 left-0 w-72 h-screen bg-white shadow-lg flex flex-col z-50"
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="p-4 flex items-center justify-center border-b border-gray-200">
        <img src={logo} className="w-24" alt="Prime Logo" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.subItems ? (
                <>
                  <button
                    onClick={
                      item.label === "Pre-Job"
                        ? togglePreJob
                        : item.label === "Job Execution"
                        ? toggleJobExecution
                        : item.label === "Post Job Phase"
                        ? togglePostJobPhase
                        : item.label === "Additional Settings"
                        ? toggleSettings
                        : toggleUserRoles
                    }
                    className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      (item.label === "Pre-Job" && isPreJobOpen) ||
                      (item.label === "Job Execution" && isJobExecutionOpen) ||
                      (item.label === "Post Job Phase" && isPostJobPhaseOpen) ||
                      (item.label === "Additional Settings" && isSettingsOpen) ||
                      (item.label === "User Roles" && isUserRolesOpen)
                        ? "bg-indigo-100 text-indigo-600"
                        : "text-gray-700 hover:bg-indigo-500 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.label === "Pre-Job" ? (
                      isPreJobOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : item.label === "Job Execution" ? (
                      isJobExecutionOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : item.label === "Post Job Phase" ? (
                      isPostJobPhaseOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : item.label === "Additional Settings" ? (
                      isSettingsOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      isUserRolesOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </button>
                  <AnimatePresence>
                    {(item.label === "Pre-Job" ? isPreJobOpen : 
                      item.label === "Job Execution" ? isJobExecutionOpen : 
                      item.label === "Post Job Phase" ? isPostJobPhaseOpen : 
                      item.label === "Additional Settings" ? isSettingsOpen : 
                      isUserRolesOpen) && (
                      <motion.ul
                        className="ml-4 mt-1 space-y-1"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            {subItem.subItems ? (
                              <>
                                <button
                                  onClick={
                                    subItem.label === "RFQ"
                                      ? toggleRFQ
                                      : subItem.label === "Initiate Work Order"
                                      ? toggleInitiateWorkOrder
                                      : toggleProcessingWorkOrders
                                  }
                                  className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                    (subItem.label === "RFQ" && isRFQOpen) ||
                                    (subItem.label === "Initiate Work Order" && isInitiateWorkOrderOpen) ||
                                    (subItem.label === "Processing Work Orders" && isProcessingWorkOrdersOpen)
                                      ? "bg-indigo-100 text-indigo-600"
                                      : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
                                  }`}
                                >
                                  <span className="flex items-center">
                                    {subItem.icon}
                                    {subItem.label}
                                  </span>
                                  {subItem.label === "RFQ" ? (
                                    isRFQOpen ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )
                                  ) : subItem.label === "Initiate Work Order" ? (
                                    isInitiateWorkOrderOpen ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )
                                  ) : (
                                    isProcessingWorkOrdersOpen ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )
                                  )}
                                </button>
                                <AnimatePresence>
                                  {(subItem.label === "RFQ"
                                    ? isRFQOpen
                                    : subItem.label === "Initiate Work Order"
                                    ? isInitiateWorkOrderOpen
                                    : isProcessingWorkOrdersOpen) && (
                                    <motion.ul
                                      className="ml-4 mt-1 space-y-1"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    >
                                      {subItem.subItems.map((nestedItem, nestedIndex) => (
                                        <li key={nestedIndex}>
                                          <NavLink
                                            to={nestedItem.to}
                                            className={({ isActive }) =>
                                              `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                                isActive ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
                                              }`
                                            }
                                            onClick={() => isMobile() && toggleSidebar()}
                                          >
                                            {nestedItem.icon}
                                            {nestedItem.label}
                                          </NavLink>
                                        </li>
                                      ))}
                                    </motion.ul>
                                  )}
                                </AnimatePresence>
                              </>
                            ) : (
                              <NavLink
                                to={subItem.to}
                                className={({ isActive }) =>
                                  `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                    isActive ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
                                  }`
                                }
                                onClick={() => isMobile() && toggleSidebar()}
                              >
                                {subItem.icon}
                                {subItem.label}
                              </NavLink>
                            )}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-500 text-white" : "text-gray-700 hover:bg-indigo-500 hover:text-white"
                    }`
                  }
                  onClick={() => isMobile() && toggleSidebar()}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;