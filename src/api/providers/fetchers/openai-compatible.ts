// import axios from "axios"

// import type { ModelRecord } from "../../../shared/api"
// import { DEFAULT_HEADERS } from "../constants"

// /**
//  * Fetches models from an OpenAI-compatible endpoint using the standard /v1/models route.
//  *
//  * @param baseUrl Base URL of the OpenAI-compatible server (e.g., https://api.example.com)
//  * @param apiKey Optional API key for Authorization header
//  */
// export async function getOpenAiCompatibleModels(baseUrl: string, apiKey?: string, openAiHeaders?: Record<string, string>) {
// 	try {
// 		if (!baseUrl) {
// 			return []
// 		}

// 		// Trim whitespace from baseUrl to handle cases where users accidentally include spaces
// 		const trimmedBaseUrl = baseUrl.trim()

// 		if (!URL.canParse(trimmedBaseUrl)) {
// 			return []
// 		}

// 		const config: Record<string, any> = {}
// 		const headers: Record<string, string> = {
// 			...DEFAULT_HEADERS,
// 			...(openAiHeaders || {}),
// 		}

// 		if (apiKey) {
// 			headers["Authorization"] = `Bearer ${apiKey}`
// 		}

// 		if (Object.keys(headers).length > 0) {
// 			config["headers"] = headers
// 		}

// 		const response = await axios.get(`${trimmedBaseUrl}/models`, config)
// 		const modelsArray = response.data?.data?.map((model: any) => model.id) || []
// 		return [...new Set<string>(modelsArray)]
// 	} catch (error) {
// 		return []
// 	}
// }
import axios from "axios"

import { LITELLM_COMPUTER_USE_MODELS } from "@roo-code/types"

import type { ModelRecord } from "../../../shared/api"

import { DEFAULT_HEADERS } from "../constants"
/**
 * Fetches available models from a LiteLLM server
 *
 * @param apiKey The API key for the LiteLLM server
 * @param baseUrl The base URL of the LiteLLM server
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails or the response is not as expected.
 */
export async function getOpenAiCompatibleModels(
	baseUrl: string,
	apiKey?: string,
	openAiHeaders?: Record<string, string>,
) {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...DEFAULT_HEADERS,
		}

		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}
		// Use URL constructor to properly join base URL and path
		// This approach handles all edge cases including paths, query params, and fragments
		const urlObj = new URL(baseUrl)
		// Normalize the pathname by removing trailing slashes and multiple slashes
		urlObj.pathname = urlObj.pathname.replace(/\/+$/, "").replace(/\/+/g, "/") + "/v1/model/info"
		const url = urlObj.href
		// Added timeout to prevent indefinite hanging
		const response = await axios.get(url, { headers, timeout: 5000 })
		const models: ModelRecord = {}

		const computerModels = Array.from(LITELLM_COMPUTER_USE_MODELS)

		// Process the model info from the response
		if (response.data && response.data.data && Array.isArray(response.data.data)) {
			const modelsArray = response.data?.data?.map((model: any) => model.id) || []
			return [...new Set<string>(modelsArray)]
		} else {
			// If response.data.data is not in the expected format, consider it an error.
			console.error("Error fetching LiteLLM models: Unexpected response format", response.data)
			throw new Error("Failed to fetch LiteLLM models: Unexpected response format.")
		}
	} catch (error: any) {
		console.error("Error fetching LiteLLM models:", error.message ? error.message : error)
		if (axios.isAxiosError(error) && error.response) {
			throw new Error(
				`Failed to fetch LiteLLM models: ${error.response.status} ${error.response.statusText}. Check base URL and API key.`,
			)
		} else if (axios.isAxiosError(error) && error.request) {
			throw new Error(
				"Failed to fetch LiteLLM models: No response from server. Check LiteLLM server status and base URL.",
			)
		} else {
			throw new Error(`Failed to fetch LiteLLM models: ${error.message || "An unknown error occurred."}`)
		}
	}
}
