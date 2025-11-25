"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const logo = document.querySelector(".logo");
    let t = 0;
    function float() {
        t += 0.03;
        const y = Math.sin(t) * 3;
        logo.style.transform = `translateY(${y}px)`;
        requestAnimationFrame(float);
    }
    float();
});
