import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
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

const ProtectedRoute = ({ children, isAuthenticated }) => {
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
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
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </ProtectedRoute>
      ),
      errorElement: (
        <div>Something went wrong. Please try again or contact support.</div>
      ),
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/additional-settings/add-series",
          element: <Series />,
        },
        {
          path: "/additional-settings/add-item",
          element: <Item />,
        },
        {
          path: "/additional-settings/add-unit",
          element: <Unit />,
        },
        {
          path: "/additional-settings/add-team",
          element: <Team />,
        },
        {
          path: "/additional-settings/add-rfq-channel",
          element: <Channels />,
        },
        {
          path: "/add-rfq",
          element: <AddRFQ />,
        },
        {
          path: "/existing-client",
          element: <ExistingClient />,
        },
        {
          path: "/edit-rfq/:id",
          element: <EditRFQ />,
        },
        {
          path: "/view-rfq",
          element: <ViewRFQ />,
        },
        {
          path: "/view-quotation",
          element: <ViewQuotation />,
        },
        {
          path: "/edit-quotation/:id",
          element: <EditQuotation />,
        },
        {
          path: "/pre-job/partial-order-selection",
          element: <PartialOrderSelection />,
        },
        {
          path: "/job-execution/initiate-work-order/list-all-purchase-orders",
          element: <ListPurchaseOrders />,
        },
        {
          path: "/job-execution/initiate-work-order/add-wo-without-po",
          element: <AddWOWithoutPO />,
        },
        {
          path: "/job-execution/processing-work-orders/list-all-processing-work-orders",
          element: <ListProcessingWorkOrders />,
        },
        {
          path: "/job-execution/processing-work-orders/edit-work-order/:id",
          element: <EditProcessingWorkOrders />,
        },
        {
          path: "/job-execution/processing-work-orders/manager-approval",
          element: <ManagerApproval />,
        },
        {
          path: "/job-execution/processing-work-orders/delivery",
          element: <Delivery />,
        },
        {
          path: "/job-execution/processing-work-orders/close-work-orders",
          element: <CloseWorkOrder />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />;
}

export default App;