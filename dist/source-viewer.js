const section = document.querySelector("#csharp");
const code = section.querySelector("code");
const filename = section.querySelector("#source-filename");
const description = section.querySelector("#source-description");
const sourceLink = section.querySelector("#source-file-link");
const copy = section.querySelector("#copy-source");
const status = section.querySelector("#source-status");
const select = section.querySelector("#source-select");
let current = "";
try {
  const response = await fetch("./csharp-source.json");
  if (!response.ok) throw new Error("Source unavailable");
  const entries = await response.json();
  for (const entry of entries) {
    const option = document.createElement("option");
    option.value = entry.name;
    option.textContent = entry.label;
    select.append(option);
  }
  const show = () => {
    const entry = entries.find((item) => item.name === select.value);
    current = entry.code;
    // The build generates and escapes this markup from the actual C# files.
    // Keep plain source separately so copying never includes highlighting tags.
    if (entry.html) code.innerHTML = entry.html;
    else code.textContent = current;
    filename.textContent = `${entry.name}.cs`;
    description.textContent = entry.description;
    sourceLink.href = `https://github.com/cronfm/scheduling-showcase/blob/main/${entry.path}`;
    status.textContent = "";
  };
  select.disabled = false;
  copy.disabled = false;
  select.addEventListener("change", show);
  select.value = "ShortestJobFirstStrategy";
  show();
} catch {
  code.textContent = "Read the C# implementation on GitHub using the link below.";
  description.textContent = "The source preview could not load. The complete .NET project is available on GitHub.";
}
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(current);
    status.textContent = "C# source copied.";
  } catch {
    status.textContent = "Select the code to copy it, or open the file on GitHub.";
  }
});
