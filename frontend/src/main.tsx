import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext"; // <--- IMPORTAR
import "./styles.scss";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				{" "}
				{/* <--- ENVOLVER LA APP */}
				<App />
			</ThemeProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
