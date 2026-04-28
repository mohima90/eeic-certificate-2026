const canvas = document.getElementById("canvas");
const width = canvas.clientWidth;
const height = canvas.clientHeight;
document.getElementById("width").value = width;
document.getElementById("height").value = height;
const template_image = document.getElementById("template_image");
template_image.addEventListener("input", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            canvas.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});
//qr code
let qrAppended = false;

$("#qrButton").click(function (e) {
    e.preventDefault();
    if (!qrAppended) {
        let qr = `<img id="qrImg" src="https://quickchart.io/qr?text=EEIC" style="position: absolute; width:75px; height:75px;"></img>`;
        $("#canvas").append(qr);
        qrAppended = true;
        let newContent = getQRInputHtml();
        $(this).closest(".rounded").after(newContent); // Correct the selector
        initializeQrCodeInputs();
        document.getElementById("qr_code").value='https://quickchart.io/qr?text=EEIC';
    }
});

function getQRInputHtml() {
    return `
<input type="hidden" name="qr_content" value="https://quickchart.io/qr?text=EEIC"/>
<input type="hidden" name="qr_x" id="qr_x"/>
<input type="hidden" name="qr_y" id="qr_y"/>`;
}

function initializeQrCodeInputs() {
    $(`#qrImg`).draggable({
        cursor: "move",
        containment: "parent",
        stop: function (event, ui) {
            const position = ui.position;
            $(`#qr_x`).val(position.left);
            $(`#qr_y`).val(position.top);
        },
    });
}
//
const student = document.getElementById("student");
const course = document.getElementById("course");
const date = document.getElementById("date");
// Student details
const student_content = document.getElementById("student_content");
const student_color = document.getElementById("student_color");
const student_font_size = document.getElementById("student_font_size");
const student_font_family = document.getElementById("student_font_family");
// COURSE DETAILS
const course_content = document.getElementById("course_content");
const course_color = document.getElementById("course_color");
const course_font_size = document.getElementById("course_font_size");
const course_font_family = document.getElementById("course_font_family");
//date details
const date_content = document.getElementById("date_content");
const date_color = document.getElementById("date_color");
const date_font_size = document.getElementById("date_font_size");
// Event listeners for title
// event listeners for course
course_content.addEventListener("input", updateCourseName);
course_color.addEventListener("input", updateCourseColor);
course_font_size.addEventListener("input", updateCourseFontSize);
course_font_family.addEventListener("change", updateCourseFontFamily);
//event listeners for student
student_content.addEventListener("input", updateStudentName);
student_color.addEventListener("input", updateStudentColor);
student_font_size.addEventListener("input", updateStudentFontSize);
student_font_family.addEventListener("change", updateStudentFontFamily);
//event listeners for date
date_content.addEventListener("input", updateDateContent);
date_color.addEventListener("input", updateDateColor);
date_font_size.addEventListener("input", updateDateFontSize);
// Function to update title text
function updateCourseName() {
    course.textContent = course_content.value;
}
function updateCourseColor() {
    course.style.color = course_color.value;
}
function updateCourseFontSize() {
    course.style.fontSize = `${course_font_size.value}px`;
}
function updateCourseFontFamily() {
    course.style.fontFamily = course_font_family.value;
    course.style.fontWeight = "normal";
    course.style.fontStyle = "normal";
}
function updateStudentName() {
    student.textContent = student_content.value;
}
function updateStudentColor() {
    student.style.color = student_color.value;
}
function updateStudentFontSize() {
    student.style.fontSize = `${student_font_size.value}px`;
}
function updateStudentFontFamily() {
    student.style.fontFamily = student_font_family.value;
    student.style.fontWeight = "normal";
    student.style.fontStyle = "normal";
}
function updateDateContent() {
    date.textContent = date_content.value;
}
function updateDateColor() {
    date.style.color = date_color.value;
}
function updateDateFontSize() {
    date.style.fontSize = `${date_font_size.value}px`;
}
$("#course").draggable({
    cursor: "move",
    containment: "parent",
    stop: function (event, ui) {
        const position = ui.position;
        $("#course_x").val(position.left);
        $("#course_y").val(position.top);
    },
});
$("#student").draggable({
    cursor: "move",
    containment: "parent",
    stop: function (event, ui) {
        const position = ui.position;
        $("#student_x").val(position.left);
        $("#student_y").val(position.top);
    },
});
$("#date").draggable({
    cursor: "move",
    containment: "parent",
    stop: function (event, ui) {
        const position = ui.position;
        $("#date_x").val(position.left);
        $("#date_y").val(position.top);
    },
});
