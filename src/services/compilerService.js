export const LANGUAGE_MAPPING = {
  assembly: 45,
  bash: 46,
  basic: 47,
  c: 50, // GCC 9.2.0
  cpp: 54, // GCC 9.2.0
  clojure: 86,
  csharp: 51,
  cobol: 77,
  lisp: 55,
  d: 56,
  elixir: 57,
  erlang: 58,
  fsharp: 87,
  fortran: 59,
  go: 60,
  groovy: 88,
  haskell: 61,
  java: 62,
  javascript: 63,
  kotlin: 78,
  lua: 64,
  objectivec: 79,
  ocaml: 65,
  octave: 66,
  pascal: 67,
  perl: 85,
  php: 68,
  plaintext: 43,
  prolog: 69,
  python: 71, // Python 3.8.1
  r: 80,
  ruby: 72,
  rust: 73,
  scala: 81,
  sql: 82,
  swift: 83,
  typescript: 74,
  vbnet: 84
};

const JUDGE0_API_URL = 'http://localhost:2358';

export const createSubmission = async (sourceCode, languageId, stdin) => {
  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Submission failed: ${response.statusText}`);
  }

  return await response.json();
};

export const getSubmission = async (token) => {
  const response = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status,compile_output,message`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch submission failed: ${response.statusText}`);
  }

  return await response.json();
};

export const runCode = async (sourceCode, languageKey, stdin) => {
  const languageId = LANGUAGE_MAPPING[languageKey];
  if (!languageId) {
    throw new Error('Unsupported language');
  }

  try {
    const { token } = await createSubmission(sourceCode, languageId, stdin);

    // Poll for results
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          const result = await getSubmission(token);
          // Status ID 1 (In Queue) and 2 (Processing) mean we keep waiting
          if (result.status.id > 2) {
            clearInterval(intervalId);
            resolve(result);
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, 1000); // Check every 1 second
    });
  } catch (error) {
    console.error('Compiler Service Error:', error);
    throw error;
  }
};
