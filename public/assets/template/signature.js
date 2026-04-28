let counter = -1;
$("#signatureButton").click(function (e) {
    e.preventDefault();
    counter++;
    $("#countSignature").val(counter);
    let signature = `<img id="signature${counter}" style="position: absolute;"></img>`;
    $("#canvas").append(signature);
    let newContainer = createSignatureContainer(counter);
    $(this).closest(".rounded").after(newContainer);
    optionsSignature(counter);
});
function createSignatureContainer(counter) {
    return `
    <div class="mb-5 rounded" id="containerSignature${counter}">
        <h3 class="fw-bolder text-center mb-6" style="color: #C70815;">Signature</h3>
        <button type="button" class="btn btn-sm btn-icon btn-active-light-primary me-n5" onclick="removeSignature(${counter})">
            <span class="svg-icon svg-icon-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect opacity="0.5" x="6" y="17.3137" width="16" height="2" rx="1" transform="rotate(-45 6 17.3137)" fill="black"></rect>
                    <rect x="7.41422" y="6" width="16" height="2" rx="1" transform="rotate(45 7.41422 6)" fill="black"></rect>
                </svg>
            </span>
        </button>
        <div class="row g-5">
            <div class="col-12">
                <label class="required form-label">Signature</label>
                <input type="file" name="signature${counter}_content" id="signature${counter}_content" class="form-control">
            </div>
            <input type="hidden" name="signature${counter}_x" id="signature${counter}_x">
            <input type="hidden" name="signature${counter}_y" id="signature${counter}_y">
        </div>
    </div>
    `;
}
function removeSignature(containerCount) {
    $(`#signature${containerCount}`).remove();
    $(`#containerSignature${containerCount}`).remove();
    counter = containerCount - 1;
    $("#countSignature").val(counter);
}
function optionsSignature(counter) {
    const signatureContent = document.getElementById(
        `signature${counter}_content`
    );
    const signatureContainer = document.getElementById(`signature${counter}`);
    signatureContent.addEventListener("input", (event) => {
        const signatureFile = event.target.files[0];
        if (signatureFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                signatureContainer.src = e.target.result;
                signatureContainer.style.width = "150px";
                signatureContainer.style.height = "100px";
            };
            reader.readAsDataURL(signatureFile);
        }
    });
    $(`#signature${counter}`).draggable({
        cursor: "move",
        containment: "parent",
        stop: function (event, ui) {
            const position = ui.position;
            $(`#signature${counter}_x`).val(position.left);
            $(`#signature${counter}_y`).val(position.top);
        },
    });
}
