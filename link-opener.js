// ==UserScript==
// @name         Explore Communication Links
// @namespace    http://tampermonkey.net/
// @author       kautbhat
// @version      1.0
// @description  Highlight document links in seller communications
// @match        https://paragon-eu.amazon.com/hz/view-case?caseId=*
// @match        https://paragon-na.amazon.com/hz/view-case?caseId=*
// @match        https://paragon-fe.amazon.com/hz/view-case?caseId=*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Create floating UI button
  function createFloatingButton() {
    const button = document.createElement("button");
    button.id = "explore-links-btn";
    button.textContent = "Explore Links";
    button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: background-color 0.3s;
        `;

    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#45a049";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#4CAF50";
    });

    button.addEventListener("click", exploreLinks);

    document.body.appendChild(button);
  }

  // Main function to explore and highlight links
  async function exploreLinks() {
    const button = document.getElementById("explore-links-btn");
    button.disabled = true;
    button.textContent = "Processing...";

    // Remove previous highlights
    document.querySelectorAll(".tm-highlighted-link").forEach((el) => {
      el.classList.remove("tm-highlighted-link");
      el.style.background = "";
      el.style.border = "";
      el.style.padding = "";
    });

    // Find all seller communication headers (with email-inbound class)
    const allHeaders = document.querySelectorAll("button.header_K_8qN");
    const sellerHeaders = Array.from(allHeaders).filter((header) => {
      return header.querySelector(".icon_cNVsJ.email-inbound__U5j7") !== null;
    });

    console.log(`Found ${sellerHeaders.length} seller communications`);

    let totalLinksFound = 0;

    // Document file extensions to look for
    const docExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".txt",
      ".zip",
      ".rar",
    ];

    // Process each seller communication
    for (let i = 0; i < sellerHeaders.length; i++) {
      const header = sellerHeaders[i];
      const isExpanded = header.getAttribute("aria-expanded") === "true";

      // Click to expand if not already expanded
      if (!isExpanded) {
        header.click();
        // Wait for expansion animation
        await sleep(300);
      }

      // Find the corresponding content region
      const regionId = header.getAttribute("aria-controls");
      const contentRegion = document.getElementById(regionId);

      if (contentRegion) {
        // Find all links in this communication
        const links = contentRegion.querySelectorAll("a");

        let linksInThisComm = 0;
        for (let j = 0; j < links.length; j++) {
          const link = links[j];
          const href = link.getAttribute("href") || "";
          const lowerHref = href.toLowerCase();

          // Check if href ends with any document extension OR contains objectName parameter with document extension
          let isDocLink = docExtensions.some((ext) => lowerHref.endsWith(ext));

          // Also check for objectName parameter in URL (for Amazon secure-download links)
          if (!isDocLink && lowerHref.includes("objectname=")) {
            isDocLink = docExtensions.some(
              (ext) =>
                lowerHref.includes("objectname=") && lowerHref.includes(ext)
            );
          }

          // Also check link text content for file extensions
          if (!isDocLink) {
            const linkText = link.textContent.trim().toLowerCase();
            isDocLink = docExtensions.some((ext) => linkText.endsWith(ext));
          }

          if (isDocLink) {
            link.classList.add("tm-highlighted-link");
            link.style.background = "yellow";
            link.style.border = "2px solid red";
            link.style.padding = "2px 4px";
            totalLinksFound++;
            linksInThisComm++;
          }
        }

        console.log(
          `Communication ${
            i + 1
          }: Found ${linksInThisComm} document links out of ${
            links.length
          } total links`
        );
      }

      // Small delay between processing communications
      await sleep(200);
    }

    button.disabled = false;
    button.textContent = `Explore Links (${totalLinksFound} found)`;

    // Reset button text after 3 seconds
    setTimeout(() => {
      button.textContent = "Explore Links";
    }, 3000);
  }

  // Helper function for delays
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Initialize when page loads
  function init() {
    // Wait for page to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createFloatingButton);
    } else {
      createFloatingButton();
    }
  }

  init();
})();
