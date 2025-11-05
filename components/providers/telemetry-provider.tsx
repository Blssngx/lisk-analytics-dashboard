"use client";
import React, { createContext, useEffect, ReactNode } from "react";

export const TelemetryContext = createContext({});

type TelemetryProviderProps = {
	children: ReactNode;
};

const TelemetryProvider = ({ children }: TelemetryProviderProps) => {
	useEffect(() => {
		let agent: any;
		if (typeof window !== "undefined") {
			import("@newrelic/browser-agent/loaders/browser-agent").then((mod) => {
				const BrowserAgent = mod.BrowserAgent;
				const options = {
					info: {
						applicationID: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID || "",
						beacon: "bam.nr-data.net",
						errorBeacon: "bam.nr-data.net",
						licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY || "",
						sa: 1,
					},
					init: {
						ajax: {
							deny_list: ["bam.nr-data.net"],
						},
						distributed_tracing: {
							allowed_origins: [],
							cors_use_newrelic_header: false,
							cors_use_tracecontext_headers: false,
							enabled: true,
							exclude_newrelic_header: false,
						},
						privacy: {
							cookies_enabled: true,
						},
						session_replay: {
							autoStart: true,
							block_selector: "",
							collect_fonts: true,
							enabled: true,
							error_sampling_rate: 100,
							fix_stylesheets: true,
							inline_images: false,
							mask_all_inputs: true,
							mask_input_options: {},
							mask_text_selector: "*",
							preload: true,
							sampling_rate: 10,
						},
					},
					loader_config: {
						accountID: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID,
						agentID: process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_AGENT_ID,
						applicationID: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID,
						licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY,
						trustKey: process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY,
					},
				};

				agent = new BrowserAgent(options);
				console.log("New Relic agent initialized", agent);
			});
		}
	}, []);

	return <TelemetryContext.Provider value={{}}>{children}</TelemetryContext.Provider>;
};

export default TelemetryProvider;
