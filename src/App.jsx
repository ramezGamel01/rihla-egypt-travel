import { createBrowserRouter, RouterProvider } from "react-router";
import { I18nProvider } from "./i18n/I18n.jsx";
import { AppProvider } from "./state/app.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";

// Pages other than Home load on demand
const page = (load) => async () => ({ Component: (await load()).default });

export const routes = [
  {
    path: "/",
    Component: Layout,
    // Shown for the moment a lazily loaded page is fetched on first load
    HydrateFallback: () => <div className="route-loading" aria-hidden="true" />,
    children: [
      { index: true, Component: Home },
      { path: "trips", lazy: page(() => import("./pages/Trips.jsx")) },
      { path: "trip/:id", lazy: page(() => import("./pages/TripDetails.jsx")) },
      { path: "checkout/:id", lazy: page(() => import("./pages/Checkout.jsx")) },
      { path: "ticket/:ref", lazy: page(() => import("./pages/Ticket.jsx")) },
      { path: "bookings", lazy: page(() => import("./pages/Bookings.jsx")) },
      { path: "signin", lazy: page(() => import("./pages/Auth.jsx")) },
      { path: "signup", lazy: page(() => import("./pages/Auth.jsx")) },
      { path: "*", lazy: page(() => import("./pages/NotFound.jsx")) },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, "") });

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>
  );
}
