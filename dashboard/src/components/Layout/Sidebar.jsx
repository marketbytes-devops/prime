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
  LayoutList,
  Combine,
  Users,
  MessageSquareQuote,
  CheckSquare,
  MailCheck,
  MailQuestionMark,
  MailWarning,
  FileSearch,
  MessagesSquare,
  ClipboardList,
  Shield,
  Search,
  File,
  FileCheck,
  List,
  CheckCircle,
  UserPlus,
  ShieldCheck,
  Lock,
  FolderKanban,
  Clock,
  FileUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../assets/images/img-logo.webp";
import apiClient from "../../helpers/apiClient";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [activeOuterMenu, setActiveOuterMenu] = useState(null); // Tracks the active outer menu
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [isInitiateWorkOrderOpen, setIsInitiateWorkOrderOpen] = useState(false);
  const [isProcessingWorkOrdersOpen, setIsProcessingWorkOrdersOpen] = useState(false);
  const [isForDeliveryPendingOpen, setIsForDeliveryPendingOpen] = useState(false);
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(false); // New state for Invoices submenu
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  // Toggle function for outer menus
  const toggleOuterMenu = (menuLabel) => {
    setActiveOuterMenu((prev) => (prev === menuLabel ? null : menuLabel));
  };

  // Inner menu toggle functions
  const toggleRFQ = () => setIsRFQOpen(!isRFQOpen);
  const toggleInitiateWorkOrder = () => setIsInitiateWorkOrderOpen(!isInitiateWorkOrderOpen);
  const toggleProcessingWorkOrders = () => setIsProcessingWorkOrdersOpen(!isProcessingWorkOrdersOpen);
  const toggleForDeliveryPending = () => setIsForDeliveryPendingOpen(!isForDeliveryPendingOpen);
  const toggleInvoices = () => setIsInvoicesOpen(!isInvoicesOpen); // New toggle for Invoices submenu

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  const menuItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      page: "Dashboard",
      action: "view",
    },
    {
      label: "Pre-Job",
      icon: <FileText className="w-5 h-5 mr-3" />,
      page: "rfq",
      action: "view",
      subItems: [
        {
          label: "RFQ",
          icon: <FileSearch className="w-5 h-5 mr-3" />,
          page: "rfq",
          action: "view",
          subItems: [
            {
              to: "/add-rfq",
              label: "Add RFQ",
              icon: <FilePlus className="w-5 h-5 mr-3" />,
              page: "rfq",
              action: "add",
            },
            {
              to: "/view-rfq",
              label: "View RFQ",
              icon: <Search className="w-5 h-5 mr-3" />,
              page: "rfq",
              action: "view",
            },
          ],
        },
        {
          to: "/view-quotation",
          label: "Quotation",
          icon: <MessageSquareQuote className="w-5 h-5 mr-3" />,
          page: "quotation",
          action: "view",
        },
      ],
    },
    {
      label: "Job Execution",
      icon: <Wrench className="w-5 h-5 mr-3" />,
      page: "job_execution",
      action: "view",
      subItems: [
        {
          label: "Initiate Work Order",
          icon: <ListOrdered className="w-5 h-5 mr-3" />,
          page: "purchase_orders",
          action: "view",
          subItems: [
            {
              to: "/job-execution/initiate-work-order/list-all-purchase-orders",
              label: "List Purchase Orders",
              icon: <File className="w-5 h-5 mr-3" />,
              page: "purchase_orders",
              action: "view",
            },
          ],
        },
        {
          label: "Processing Work Orders",
          icon: <FolderKanban className="w-5 h-5 mr-3" />,
          page: "processing_work_orders",
          action: "view",
          subItems: [
            {
              to: "/job-execution/processing-work-orders/list-all-processing-work-orders",
              label: "List Processing WO",
              icon: <List className="w-5 h-5 mr-3" />,
              page: "processing_work_orders",
              action: "view",
            },
            {
              to: "/job-execution/processing-work-orders/declined-work-orders",
              label: "Declined Work Orders",
              icon: <FileCheck className="w-5 h-5 mr-3" />,
              page: "declined_work_orders",
              action: "view",
            },
            {
              to: "/job-execution/processing-work-orders/manager-approval",
              label: "Manager Approval",
              icon: <CheckCircle className="w-5 h-5 mr-3" />,
              page: "manager_approval",
              action: "view",
            },
            {
              label: "Delivery",
              icon: <MailQuestionMark className="w-5 h-5 mr-3" />,
              page: "delivery",
              action: "view",
              subItems: [
                {
                  to: "/job-execution/processing-work-orders/delivery",
                  label: "For Delivery",
                  icon: <MailCheck className="w-5 h-5 mr-3" />,
                  page: "delivery",
                  action: "view",
                },
                {
                  to: "/job-execution/processing-work-orders/pending-deliveries",
                  label: "Pending Delivery",
                  icon: <MailWarning className="w-5 h-5 mr-3" />,
                  page: "pending_deliveries",
                  action: "view",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      label: "Post Job Phase",
      icon: <ClipboardList className="w-5 h-5 mr-3" />,
      page: "post_job_phase",
      action: "view",
      subItems: [
        {
          label: "Invoices",
          icon: <FileCheck className="w-5 h-5 mr-3" />,
          page: "invoices",
          action: "view",
          subItems: [
            {
              to: "/post-job-phase/pending-invoices",
              label: "Pending Invoices",
              icon: <Clock className="w-5 h-5 mr-3" />,
              page: "pending_invoices",
              action: "view",
            },
            {
              to: "/post-job-phase/raised-invoices",
              label: "Raised Invoices",
              icon: <FileUp className="w-5 h-5 mr-3" />,
              page: "raised_invoices",
              action: "view",
            },
            {
              to: "/post-job-phase/processed-invoices",
              label: "Processed Invoices",
              icon: <CheckSquare className="w-5 h-5 mr-3" />,
              page: "processed_invoices",
              action: "view",
            },
          ],
        },
        // {
        //   to: "/post-job-phase/completed-wo",
        //   label: "Completed WO",
        //   icon: <CheckSquare className="w-5 h-5 mr-3" />,
        //   page: "completed_work_orders",
        //   action: "view",
        // },
      ],
    },
    {
      label: "Additional Settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      page: "additional_settings",
      action: "view",
      subItems: [
        {
          to: "/additional-settings/add-series",
          label: "Series",
          icon: <ListOrdered className="w-5 h-5 mr-3" />,
          page: "series",
          action: "view",
        },
        {
          to: "/additional-settings/add-rfq-channel",
          label: "RFQ Channel",
          icon: <MessagesSquare className="w-5 h-5 mr-3" />,
          page: "rfq_channel",
          action: "view",
        },
        {
          to: "/additional-settings/add-item",
          label: "Item",
          icon: <LayoutList className="w-5 h-5 mr-3" />,
          page: "item",
          action: "view",
        },
        {
          to: "/additional-settings/add-unit",
          label: "Unit",
          icon: <Combine className="w-5 h-5 mr-3" />,
          page: "unit",
          action: "view",
        },
        {
          to: "/additional-settings/add-team",
          label: "Team",
          icon: <UserPlus className="w-5 h-5 mr-3" />,
          page: "team",
          action: "view",
        },
      ],
    },
    {
      label: "User Roles",
      icon: <Shield className="w-5 h-5 mr-3" />,
      page: "users",
      action: "view",
      subItems: [
        {
          to: "/user-roles/roles",
          label: "Roles",
          icon: <ShieldCheck className="w-5 h-5 mr-3" />,
          page: "roles",
          action: "view",
        },
        {
          to: "/user-roles/users",
          label: "Users",
          icon: <Users className="w-5 h-5 mr-3" />,
          page: "users",
          action: "view",
        },
        {
          to: "/user-roles/permissions",
          label: "Permissions",
          icon: <Lock className="w-5 h-5 mr-3" />,
          page: "permissions",
          action: "view",
        },
      ],
    },
    {
      to: "/profile",
      label: "Profile",
      icon: <User className="w-5 h-5 mr-3" />,
      page: "Profile",
      action: "view",
    },
  ];

  const renderMenuItem = (item) => {
    if (isLoading) {
      return (
        <div className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-gray-700">
          {item.icon}
          {item.label}
        </div>
      );
    }

    if (item.subItems) {
      const filteredSubItems = item.subItems.filter((subItem) => {
        if (subItem.subItems) {
          return subItem.subItems.some((nestedItem) =>
            hasPermission(nestedItem.page, nestedItem.action)
          );
        }
        return hasPermission(subItem.page, subItem.action);
      });

      if (filteredSubItems.length === 0) return null;

      const isActiveSubmenu = (subItems) => {
        return subItems.some((subItem) => {
          if (subItem.subItems) {
            return subItem.subItems.some(
              (nestedItem) => location.pathname === nestedItem.to
            );
          }
          return location.pathname === subItem.to;
        });
      };

      const isMenuOpen = activeOuterMenu === item.label ||
        (item.label === "RFQ" && isRFQOpen) ||
        (item.label === "Initiate Work Order" && isInitiateWorkOrderOpen) ||
        (item.label === "Processing Work Orders" && isProcessingWorkOrdersOpen) ||
        (item.label === "Delivery" && isForDeliveryPendingOpen) ||
        (item.label === "Invoices" && isInvoicesOpen);

      return (
        <>
          <button
            onClick={() => {
              if (item.label === "Pre-Job") toggleOuterMenu("Pre-Job");
              else if (item.label === "Job Execution") toggleOuterMenu("Job Execution");
              else if (item.label === "Post Job Phase") toggleOuterMenu("Post Job Phase");
              else if (item.label === "Additional Settings") toggleOuterMenu("Additional Settings");
              else if (item.label === "User Roles") toggleOuterMenu("User Roles");
              else if (item.label === "RFQ") toggleRFQ();
              else if (item.label === "Initiate Work Order") toggleInitiateWorkOrder();
              else if (item.label === "Processing Work Orders") toggleProcessingWorkOrders();
              else if (item.label === "Delivery") toggleForDeliveryPending();
              else if (item.label === "Invoices") toggleInvoices();
            }}
            className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isMenuOpen || isActiveSubmenu(item.subItems)
                ? "bg-indigo-100 text-indigo-600"
                : "text-gray-700 hover:bg-indigo-500 hover:text-white"
            }`}
          >
            <span className="flex items-center">
              {item.icon}
              {item.label}
            </span>
            {(item.label === "Pre-Job" && (activeOuterMenu === "Pre-Job" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Job Execution" && (activeOuterMenu === "Job Execution" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Post Job Phase" && (activeOuterMenu === "Post Job Phase" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Additional Settings" && (activeOuterMenu === "Additional Settings" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "User Roles" && (activeOuterMenu === "User Roles" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "RFQ" && (isRFQOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Initiate Work Order" && (isInitiateWorkOrderOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Processing Work Orders" && (isProcessingWorkOrdersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Delivery" && (isForDeliveryPendingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)) ||
              (item.label === "Invoices" && (isInvoicesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />))}
          </button>
          <AnimatePresence>
            {(item.label === "Pre-Job" ? activeOuterMenu === "Pre-Job" :
              item.label === "Job Execution" ? activeOuterMenu === "Job Execution" :
              item.label === "Post Job Phase" ? activeOuterMenu === "Post Job Phase" :
              item.label === "Additional Settings" ? activeOuterMenu === "Additional Settings" :
              item.label === "User Roles" ? activeOuterMenu === "User Roles" :
              item.label === "RFQ" ? isRFQOpen :
              item.label === "Initiate Work Order" ? isInitiateWorkOrderOpen :
              item.label === "Processing Work Orders" ? isProcessingWorkOrdersOpen :
              item.label === "Delivery" ? isForDeliveryPendingOpen :
              item.label === "Invoices" ? isInvoicesOpen : false) && (
              <motion.ul
                className="ml-4 mt-1 space-y-1"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {filteredSubItems.map((subItem, subIndex) => (
                  <li key={subIndex}>
                    {subItem.subItems ? (
                      renderMenuItem(subItem)
                    ) : (
                      <NavLink
                        to={subItem.to}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? "bg-indigo-500 text-white"
                              : "text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
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
      );
    } else {
      if (!hasPermission(item.page, item.action)) return null;

      return (
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isActive
                ? "bg-indigo-500 text-white"
                : "text-gray-700 hover:bg-indigo-500 hover:text-white"
            }`
          }
          onClick={() => isMobile() && toggleSidebar()}
        >
          {item.icon}
          {item.label}
        </NavLink>
      );
    }
  };

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
            <li key={index}>{renderMenuItem(item)}</li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;