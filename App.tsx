import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LawDetail from "@/pages/law-detail";

// Import Google Material Icons
const MaterialIconsStyle = () => (
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/law/:id" component={LawDetail} />
      <Route path="/act/:id" component={LawDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MaterialIconsStyle />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
