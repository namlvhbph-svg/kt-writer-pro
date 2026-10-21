import AuthGuard from "./components/auth/AuthGuard";
import AppLayout from "./layouts/AppLayout";
import ArticleEditor from "./pages/ArticleEditor";
import Articles from "./pages/Articles";
import Dashboard from "./pages/Dashboard";
import DocumentDetail from "./pages/DocumentDetail";
import Documents from "./pages/Documents";
import Keywords from "./pages/Keywords";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

export const routers = [
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/",
    name: "app",
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, name: "dashboard", element: <Dashboard /> },
      { path: "documents", name: "documents", element: <Documents /> },
      { path: "documents/:id", name: "document-detail", element: <DocumentDetail /> },
      { path: "keywords", name: "keywords", element: <Keywords /> },
      { path: "articles", name: "articles", element: <Articles /> },
      { path: "articles/:id", name: "article-editor", element: <ArticleEditor /> },
      { path: "settings", name: "settings", element: <Settings /> },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
