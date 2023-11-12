/**
 * Business logic for the AI-generated features.
 */
import { queryLLM } from "./backend";
import { ChatHistoryInfo, Dict } from "./typing";
import { fromMarkdown } from "mdast-util-from-markdown";

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIError";
  }
}

// Input and outputs of autofill are both rows of strings.
export type Row = string;

// LLM to use for AI features.
const LLM = "gpt-3.5-turbo";

/**
 * Flattens markdown AST to text
 */
function compileTextFromMdAST(md: Dict): string {
  if (md?.type === "text")
    return md.value ?? "";
  else if (md?.children?.length > 0)
    return md.children.map(compileTextFromMdAST).join("\n");
  return "";
}

/**
 * Generate the system message used for autofilling.
 * @param n number of rows to generate
 */
function autofillSystemMessage(n: number): string {
  return `Here is a list of commands or items. Say what the pattern seems to be and generate ${n} more commands or items as an unordered markdown list:`;
}

/**
 * Generate the system message used for generate and replace (GAR).
 */
function GARSystemMessage(n: number, creative?: boolean, generatePrompts?: boolean): string {
  return `Generate a list of exactly ${n} items. Format your response as an unordered markdown list using "-". Do not ever repeat anything.${creative ? "Be unconventional with your outputs." : ""} ${generatePrompts ? "Your outputs should be commands that can be given to an AI chat assistant." : ""}`;
}

/**
 * Returns a string representing the given rows as a markdown list
 * @param rows to encode
 */
function encode(rows: Row[]): string {
  return rows.map(row => `- ${row}`).join('\n');
}

/**
 * Returns a list of items that appears in the given markdown text. Throws an AIError if the string is not in markdown list format.
 * @param mdText raw text to decode (in markdown format)
 */
function decode(mdText: string): Row[] {

  let result: Row[] = [];

  // Parse string as markdown
  const md = fromMarkdown(mdText);

  if (md?.children.length > 0 && md.children.some(c => c.type === 'list')) {
    // Find the first list that appears in the markdown text, if any
    const md_list = md.children.filter(c => c.type === 'list')[0];

    // Extract and iterate over the list items, converting them to text 
    const md_list_items = "children" in md_list ? md_list.children : [];
    for (const item of md_list_items) {
      const text = compileTextFromMdAST(item);
      if (text && text.length > 0)
        result.push(text);
    }
  }

  if (result.length === 0)
    throw new AIError(`Failed to decode output: ${mdText}`);
  
  return result;
}

/**
 * Uses an LLM to interpret the pattern from the given rows as return new rows following the pattern.
 * @param input rows for the autofilling system
 * @param n number of results to return
 */
export async function autofill(input: Row[], n: number): Promise<Row[]> {
  // hash the arguments to get a unique id
  let id = JSON.stringify([input, n]);

  let history: ChatHistoryInfo[] = [{
    messages: [{
      "role": "system",
      "content": autofillSystemMessage(n),
    }],
    fill_history: {},
  }]

  let encoded = encode(input);

  let result = await queryLLM(
    /*id=*/ id,
    /*llm=*/ LLM,
    /*n=*/ 1,
    /*prompt=*/ encoded,
    /*vars=*/ {},
    /*chat_history=*/ history,
    /*api_keys=*/ undefined,
    /*no_cache=*/ true);

  console.log("LLM said: ", result.responses[0].responses[0])

  const new_items = decode(result.responses[0].responses[0]);
  return new_items.slice(0, n);
}

/**
 * Uses an LLM to generate `n` new rows based on the pattern explained in `prompt`.
 * @param prompt 
 * @param n 
 */
export async function generateAndReplace(prompt: string, n: number, creative?: boolean): Promise<Row[]> {
  // hash the arguments to get a unique id
  let id = JSON.stringify([prompt, n]);

  // True if `prompt` contains the word 'prompt'
  let generatePrompts = prompt.toLowerCase().includes('prompt');

  let history: ChatHistoryInfo[] = [{
    messages: [{
      "role": "system",
      "content": GARSystemMessage(n, creative, generatePrompts),
    }],
    fill_history: {},
  }]

  let input = `Generate a list of ${prompt}`;

  let result = await queryLLM(
    /*id=*/ id,
    /*llm=*/ LLM,
    /*n=*/ 1,
    /*prompt=*/ input,
    /*vars=*/ {},
    /*chat_history=*/ history,
    /*api_keys=*/ undefined,
    /*no_cache=*/ true);

  console.log("LLM said: ", result.responses[0].responses[0])

  const new_items = decode(result.responses[0].responses[0]);
  return new_items.slice(0, n);
}