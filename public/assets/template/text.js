let count = -1;

$("#textButton").click(function (e) {
    e.preventDefault();
    count++;
    $("#countText").val(count);
    let text = `<div id="text${count}" style="position: absolute; text-align: left; direction: ltr;"></div>`;
    $("#canvas").append(text);
    let newContainer = createContainer(count);
    $(this).closest(".rounded").after(newContainer);
    options(count);
});

function createContainer(count) {
    let fontOptions = fonts.map(font => `<option value="${font.name}">${font.name}</option>`).join('');
    return `
    <div class="mb-5 rounded" id="container${count}">
        <h3 class="fw-bolder text-center mb-6" style="color: #C70815;">Text</h3>
        <button type="button" class="btn btn-sm btn-icon btn-active-light-primary me-n5" onclick="removeText(${count})">
            <span class="svg-icon svg-icon-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="black"></rect>
                    <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="black"></rect>
                </svg>
            </span>
        </button>
        <div class="row g-5">
            <div class="col-6">
                <label class="required form-label">Content</label>
                <input type="text" placeholder="Enter Your Content" name="text${count}_content" id="text${count}_content" class="form-control">
            </div>
            <div class="col-6">
                <label class="required form-label">Color</label>
                <input type="color" class="form-control text_color" name="text${count}_color" id="text${count}_color">
            </div>
            <div class="col-6">
                <label class="form-label">Font Size</label>
                <input type="number" class="form-control" name="text${count}_font_size" id="text${count}_font_size" placeholder="Enter Your Font Size">
            </div>
            <div class="col-6">
                <label class="form-label">Font Family</label>
                <select class="form-select form-select-solid" id="text${count}_font_family" name="text${count}_font_family">
                     <option disabled selected value="">Select Font</option>
                        ${fontOptions}
                </select>
            </div>
            <input type="hidden" name="text${count}_x" id="text${count}_x">
            <input type="hidden" name="text${count}_y" id="text${count}_y">
        </div>
    </div>
    `;
}

function removeText(containerCount) {
    $(`#text${containerCount}`).remove();
    $(`#container${containerCount}`).remove();
    count = containerCount - 1;
    $("#countText").val(count);
}

function options(containerCount) {
    const text_content = document.getElementById(`text${containerCount}_content`);
    const text_color = document.getElementById(`text${containerCount}_color`);
    const text_font_family = document.getElementById(`text${containerCount}_font_family`);
    const text_font_size = document.getElementById(`text${containerCount}_font_size`);

    text_content.addEventListener("input", () => updateTopTitle(containerCount));
    text_color.addEventListener("input", () => updateTopTitleColor(containerCount));
    text_font_size.addEventListener("input", () => updateTopTitleFontSize(containerCount));
    text_font_family.addEventListener("change", () => updateTopTitleFontFamily(containerCount));

    $(`#text${containerCount}`).draggable({
        cursor: "move",
        containment: "parent",
        stop: function (event, ui) {
            const position = ui.position;
            $(`#text${containerCount}_x`).val(position.left);
            $(`#text${containerCount}_y`).val(position.top);
        },
    });
}

function updateTopTitle(containerCount) {
    const text = document.getElementById(`text${containerCount}`);
    const text_content = document.getElementById(`text${containerCount}_content`);
    text.textContent = text_content.value;
}

function updateTopTitleColor(containerCount) {
    const text = document.getElementById(`text${containerCount}`);
    const text_color = document.getElementById(`text${containerCount}_color`);
    text.style.color = text_color.value;
}

function updateTopTitleFontSize(containerCount) {
    const text = document.getElementById(`text${containerCount}`);
    const text_font_size = document.getElementById(`text${containerCount}_font_size`);
    text.style.fontSize = `${text_font_size.value}px`;
}

function updateTopTitleFontFamily(containerCount) {
    const text = document.getElementById(`text${containerCount}`);
    const text_font_family = document.getElementById(`text${containerCount}_font_family`);
    text.style.fontFamily = text_font_family.value;
    text.style.textAlign = "left";
    text.style.direction = "ltr";
}
