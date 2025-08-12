import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import AddRFQ from "./pages/PreJob/RFQ/AddRFQ";
import EditRFQ from "./pages/PreJob/RFQ/EditRFQ";
import ViewRFQ from "./pages/PreJob/RFQ/ViewRFQ";
import ViewQuotation from "./pages/PreJob/Quotation/ViewQuotation";
import EditQuotation from "./pages/PreJob/Quotation/EditQuotation";
import Item from "./pages/AdditionalSettings/Item";
import Team from "./pages/AdditionalSettings/Team";
import Channels from "./pages/AdditionalSettings/Channels";
import Series from "./pages/AdditionalSettings/Series";
import Unit from "./pages/AdditionalSettings/Unit";
import PartialOrderSelection from "./pages/PreJob/Quotation/PartialOrderSelection";
import ExistingClient from "./components/ExistingClient";
import ListPurchaseOrders from "./pages/JobExecution/InitiateWorkOrder/ListPurchaseOrders";
import AddWOWithoutPO from "./pages/JobExecution/InitiateWorkOrder/AddWOWithoutPO";
import ListProcessingWorkOrders from "./pages/JobExecution/ProcessingWorkOrders/ListProcessingWorkOrders";
import ManagerApproval from "./pages/JobExecution/ProcessingWorkOrders/ManagerApproval";
import Delivery from "./pages/JobExecution/ProcessingWorkOrders/Delivery";
import CloseWorkOrder from "./pages/JobExecution/ProcessingWorkOrders/CloseWorkOrder";
import EditProcessingWorkOrders from "./pages/JobExecution/ProcessingWorkOrders/EditProcessingWorkOrders";
import PendingInvoices from "./pages/PostJobPhase/Pendinginvoices";
import CompletedWO from "./pages/PostJobPhase/CompletedWo";
import Users from "./pages/UserRoles/Users";
import Roles from "./pages/UserRoles/Roles";
import Permissions from "./pages/UserRoles/Permissions";
import apiClient from "../../../prime/dashboard/src/helpers/apiClient";

const ProtectedRoute = ({ children, isAuthenticated, requiredPage, requiredAction = "view" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/profile/");
        const user = response.data;

        if (user.is_superuser || user.role?.name === "Superadmin") {
          setHasPermission(true);
          setIsLoading(false);
          return;
        }

        const roleId = user.role?.id;
        if (!roleId) {
          setHasPermission(false);
          setIsLoading(false);
          return;
        }

        const roleResponse = await apiClient.get(`/roles/${roleId}/`);
        const perms = roleResponse.data.permissions || [];
        const pagePerm = perms.find((p) => p.page === requiredPage);

        if (!requiredPage || (pagePerm && pagePerm[`can_${requiredAction}`])) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, requiredPage, requiredAction]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login setIsAuthenticated={setIsAuthenticated} />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="Dashboard">
          <Layout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        </ProtectedRoute>
      ),
      errorElement: <div>Something went wrong. Please try again or contact support.</div>,
      children: [
        { index: true, element: <Dashboard /> },
        {
          path: "/add-rfq",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="rfq" requiredAction="add">
              <AddRFQ />
            </ProtectedRoute>
          ),
        },
        { path: "/existing-client", element: <ExistingClient /> },
        {
          path: "/edit-rfq/:id",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="rfq" requiredAction="edit">
              <EditRFQ />
            </ProtectedRoute>
          ),
        },
        {
          path: "/view-rfq",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="rfq" requiredAction="view">
              <ViewRFQ />
            </ProtectedRoute>
          ),
        },
        {
          path: "/view-quotation",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="quotation" requiredAction="view">
              <ViewQuotation />
            </ProtectedRoute>
          ),
        },
        {
          path: "/edit-quotation/:id",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="quotation" requiredAction="edit">
              <EditQuotation />
            </ProtectedRoute>
          ),
        },
        { path: "/pre-job/partial-order-selection", element: <PartialOrderSelection /> },
        {
          path: "/job-execution/initiate-work-order/list-all-purchase-orders",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="purchase_orders" requiredAction="view">
              <ListPurchaseOrders />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/initiate-work-order/add-wo-without-po",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="work_orders" requiredAction="add">
              <AddWOWithoutPO />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/processing-work-orders/list-all-processing-work-orders",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="processing_work_orders" requiredAction="view">
              <ListProcessingWorkOrders />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/processing-work-orders/edit-work-order/:id",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="processing_work_orders" requiredAction="edit">
              <EditProcessingWorkOrders />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/processing-work-orders/manager-approval",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="manager_approval" requiredAction="view">
              <ManagerApproval />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/processing-work-orders/delivery",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="delivery" requiredAction="view">
              <Delivery />
            </ProtectedRoute>
          ),
        },
        {
          path: "/job-execution/processing-work-orders/close-work-orders",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="close_work_orders" requiredAction="view">
              <CloseWorkOrder />
            </ProtectedRoute>
          ),
        },
        {
          path: "/post-job-phase/pending-invoices",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="pending_invoices" requiredAction="view">
              <PendingInvoices />
            </ProtectedRoute>
          ),
        },
        {
          path: "/post-job-phase/completed-wo",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="completed_work_orders" requiredAction="view">
              <CompletedWO />
            </ProtectedRoute>
          ),
        },
        {
          path: "/profile",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="Profile">
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/add-series",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="series" requiredAction="view">
              <Series />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/add-item",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="item" requiredAction="view">
              <Item />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/add-unit",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="unit" requiredAction="view">
              <Unit />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/add-team",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="team" requiredAction="view">
              <Team />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/add-rfq-channel",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="rfq_channel" requiredAction="view">
              <Channels />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/users",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="users" requiredAction="view">
              <Users />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/roles",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="roles" requiredAction="view">
              <Roles />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/permissions",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="permissions" requiredAction="view">
              <Permissions />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;