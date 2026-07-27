const TAVILY_API_KEY = "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";

window.liveSearch = async function(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      include_answer: true,
      max_results: 3
    })
  });

  const data = await response.json();

  alert(JSON.stringify(data));

  return data;
};
