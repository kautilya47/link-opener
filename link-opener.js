// ==UserScript==
// @name         Explore Communication Links
// @namespace    http://tampermonkey.net/
// @author       kautbhat
// @version      1.1
// @description  Highlight document links in seller communications and download each file sequentially
// @match        https://paragon-eu.amazon.com/hz/view-case?caseId=*
// @match        https://paragon-na.amazon.com/hz/view-case?caseId=*
// @match        https://paragon-fe.amazon.com/hz/view-case?caseId=*
// @match        https://paragon-eu.amazon.com/hz/view-case?*
// @match        https://paragon-na.amazon.com/hz/view-case?*
// @match        https://paragon-fe.amazon.com/hz/view-case?*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Create buttons in header or floating position
  function createFloatingButton() {
    // Try to find the target container
    const targetContainer = document.querySelector(
      "#page-body > div > div > div > div > div > div > div > div > div:nth-child(1) > div > div > div:nth-child(3) > div > div > div.dvr-grid_GL0L3 > div > div:nth-child(2) > div > div > div > section > div > div.parent_WyMkx.xl_Z2eTb.column_L4Hlv > div:nth-child(1) > section > header > div > div"
    );

    // Create button container
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "child_j_Mug";
    buttonWrapper.id = "explore-links-wrapper";

    const exploreBtn = document.createElement("button");
    exploreBtn.id = "explore-links-btn";
    exploreBtn.className = "tertiary";
    exploreBtn.type = "button";
    exploreBtn.textContent = "Explore Links";
    // Apply full styles for the explore button (always)
    exploreBtn.style.cssText = `
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

    exploreBtn.addEventListener("click", exploreLinks);

    // Create download button wrapper
    const downloadWrapper = document.createElement("div");
    downloadWrapper.className = "child_j_Mug";
    downloadWrapper.id = "download-all-wrapper";
    downloadWrapper.style.display = "none";

    const downloadBtn = document.createElement("button");
    downloadBtn.id = "download-all-btn";
    downloadBtn.className = "tertiary";
    downloadBtn.type = "button";
    downloadBtn.textContent = "Download All";
    // Apply full styles for the download button (always)
    downloadBtn.style.cssText = `
            padding: 12px 24px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: background-color 0.3s;
        `;

    downloadBtn.addEventListener("click", downloadAllLinks);

    buttonWrapper.appendChild(exploreBtn);
    downloadWrapper.appendChild(downloadBtn);

    // If target container found, append there; otherwise append wrappers directly to body
    if (targetContainer) {
      targetContainer.appendChild(buttonWrapper);
      targetContainer.appendChild(downloadWrapper);
    } else {
      console.warn(
        "Target container not found, appending buttons directly to body"
      );
      // Position the button wrapper in a fixed location so it behaves like the previous floating container
      buttonWrapper.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                gap: 10px;
            `;
      // Ensure download wrapper sits next to the button wrapper when appended to body
      downloadWrapper.style.cssText = `
                display: inline-block;
                margin-left: 8px;
            `;

      document.body.appendChild(buttonWrapper);
      document.body.appendChild(downloadWrapper);
    }
  }

  // Main function to explore and highlight links
  async function exploreLinks() {
    const button = document.getElementById("explore-links-btn");
    button.disabled = true;
    button.textContent = "Processing...";

    // Remove previous highlights and individual download buttons
    document.querySelectorAll(".tm-highlighted-link").forEach((el) => {
      el.classList.remove("tm-highlighted-link");
      el.style.background = "";
      el.style.border = "";
      el.style.padding = "";
    });
    
    // Remove existing individual download buttons
    document.querySelectorAll(".tm-individual-download-btn").forEach((btn) => {
      btn.remove();
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
        const docLinksInThisComm = [];
        
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
            docLinksInThisComm.push(link);
          }
        }

        // Add individual download button if links were found
        if (linksInThisComm > 0) {
          addIndividualDownloadButton(contentRegion, docLinksInThisComm, i + 1);
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

    // Show download button if links were found
    const downloadWrapper = document.getElementById("download-all-wrapper");
    if (totalLinksFound > 0) {
      downloadWrapper.style.display = "block";
    } else {
      downloadWrapper.style.display = "none";
    }

    // Reset button text after 3 seconds
    setTimeout(() => {
      button.textContent = "Explore Links";
    }, 3000);
  }

  // Function to add individual download button to a communication section
  function addIndividualDownloadButton(contentRegion, docLinks, commNumber) {
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "tm-individual-download-btn";
    downloadBtn.textContent = `Download ${docLinks.length} file${docLinks.length > 1 ? 's' : ''}`;
    downloadBtn.style.cssText = `
      padding: 8px 16px;
      background-color: #FF9800;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      margin: 10px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background-color 0.3s;
    `;
    
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.backgroundColor = '#F57C00';
    });
    
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.backgroundColor = '#FF9800';
    });
    
    downloadBtn.addEventListener('click', async () => {
      await downloadLinksFromSection(downloadBtn, docLinks, commNumber);
    });
    
    // Insert button at the top of content region
    contentRegion.insertBefore(downloadBtn, contentRegion.firstChild);
  }

  // Function to download links from a specific section
  async function downloadLinksFromSection(button, links, commNumber) {
    button.disabled = true;
    const originalText = button.textContent;
    
    console.log(`Starting download of ${links.length} files from communication ${commNumber}...`);
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      button.textContent = `Downloading ${i + 1}/${links.length}`;
      
      // Click the link to trigger download
      link.click();
      
      console.log(`Downloaded: ${link.textContent.trim()}`);
      
      // Wait 1.5 seconds between downloads
      if (i < links.length - 1) {
        await sleep(1500);
      }
    }
    
    button.textContent = `✓ Downloaded ${links.length} file${links.length > 1 ? 's' : ''}`;
    button.disabled = false;
    
    // Reset button text after 3 seconds
    setTimeout(() => {
      button.textContent = originalText;
    }, 3000);
  }

  // Function to download all highlighted links
  async function downloadAllLinks() {
    const downloadBtn = document.getElementById("download-all-btn");
    const highlightedLinks = document.querySelectorAll(".tm-highlighted-link");

    if (highlightedLinks.length === 0) {
      alert('No links to download. Please click "Explore Links" first.');
      return;
    }

    downloadBtn.disabled = true;
    const originalText = downloadBtn.textContent;

    console.log(`Starting download of ${highlightedLinks.length} files...`);

    // Download each link with a delay
    for (let i = 0; i < highlightedLinks.length; i++) {
      const link = highlightedLinks[i];
      downloadBtn.textContent = `Downloading ${i + 1}/${
        highlightedLinks.length
      }`;

      // Click the link to trigger download
      link.click();

      console.log(`Downloaded: ${link.textContent.trim()}`);

      // Wait 1.5 seconds between downloads to avoid overwhelming browser/server
      if (i < highlightedLinks.length - 1) {
        await sleep(1500);
      }
    }

    downloadBtn.textContent = `✓ Downloaded ${highlightedLinks.length} files`;
    downloadBtn.disabled = false;

    // Reset button text after 3 seconds
    setTimeout(() => {
      downloadBtn.textContent = originalText;
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