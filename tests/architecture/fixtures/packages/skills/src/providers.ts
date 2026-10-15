import AzureOpenAI from '@azure/openai';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { VertexAI } from '@google-cloud/vertexai';
export const forbidden = [AzureOpenAI, BedrockRuntimeClient, VertexAI];
