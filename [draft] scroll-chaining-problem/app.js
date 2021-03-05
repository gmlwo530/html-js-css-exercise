window.onload = () => {
  document.querySelectorAll(".parent").forEach(function (val) {
    let liString = "";
    for (let i = 0; i < 100; i++) {
      liString += "<li>This is Text</li>";
    }

    const domString = `
      <ul>
        ${liString}
      </ul>
      <div class="child">
        <ul>
          ${liString}
        </ul>
      </div>
    `;

    val.innerHTML = domString;
  });
};
