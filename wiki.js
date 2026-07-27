async function getWikiAnswer(query) {
  try {
    const url =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(query);

    const res = await fetch(url);
    const data = await res.json();

    if (data && data.extract) {
      return data.extract;
    }

    return null;
  } catch (e) {
    return null;
  }
}
