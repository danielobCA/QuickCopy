// Function to apply the selected theme
function applyTheme(theme) {
  fetch('colors.json')
    .then(response => response.json())
    .then(colors => {
      const themeColors = colors[theme] || colors.default; // Default to 'default' if theme is not found

      // Apply gradient background
      document.body.style.background = `linear-gradient(135deg, ${themeColors.backgroundGradient.start}, ${themeColors.backgroundGradient.end})`;

      // Apply titleBox styles
      const titleBox = document.getElementById('titleBox');
      titleBox.style.backgroundColor = themeColors.titleBox.backgroundColor;
      titleBox.style.color = themeColors.titleBox.fontColor;

      // Apply copyButton styles
      const copyButton = document.getElementById('copyButton');
      copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      copyButton.style.color = themeColors.copyButton.fontColor;

      // Change hover color of copyButton dynamically
      copyButton.addEventListener('mouseenter', () => {
        copyButton.style.background = themeColors.copyButton.hoverColor;
      });
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      });

      // Apply headerData color
      const headerData = document.getElementById('headerData');
      headerData.style.color = themeColors.headerData.fontColor;

      // Apply number color
      const number = document.getElementById('number');
      number.style.color = themeColors.number.fontColor;

      // Apply notification styles
      const notification = document.getElementById('copyNotification');
      notification.style.backgroundColor = themeColors.notification.backgroundColor;
      notification.style.color = themeColors.notification.fontColor;
    })
    .catch(error => console.error('Error loading colors:', error));
}

document.addEventListener('DOMContentLoaded', function () {
  const themeDropdown = document.getElementById('themeDropdown');

  // Load the saved theme or default
  const savedTheme = localStorage.getItem('theme') || 'default';
  applyTheme(savedTheme);
  themeDropdown.value = savedTheme;

  // Handle theme changes
  themeDropdown.addEventListener('change', function () {
    const selectedTheme = themeDropdown.value;
    applyTheme(selectedTheme);
    // Save the selected theme to localStorage
    localStorage.setItem('theme', selectedTheme);
  });

  // Fetch data and handle copy functionality
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getHeaderDataAndNumbers
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        const data = results[0].result;
        if (data) {
          // Add a period to the end of the header
          document.getElementById('headerData').innerText = (data.header || 'Header not found') + '.';
          document.getElementById('number').innerText = data.numbers || 'Numbers not found';
        } else {
          console.error('No data returned from the content script.');
        }
      }
    });
  });

  // Add event listener to copy button
  document.getElementById('copyButton').addEventListener('click', function () {
    const numbers = document.getElementById('number').innerText;
    const header = document.getElementById('headerData').innerText;
    const fullText = header + " " + numbers.replace(/\n/g, ' '); // Replace newlines with spaces
    copyToClipboard(fullText);
  });
});

function getHeaderDataAndNumbers() {
  try {
    // XPath for the header 
    const headerXPath = "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[2]/header/div[1]/h6[1]";
    const header = document.evaluate(headerXPath, document, null, XPathResult.STRING_TYPE, null).stringValue || 'No system selected';
    
    // XPath pairs for the scraped data
    const pairs = [
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[1]", // jita
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[1]/h3/div/div/p[2]" // jumps
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[1]", // hek
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[2]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[1]", // amarr
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[3]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[1]", // rens
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[4]/h3/div/div/p[2]"
      },
      {
        xPath1: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[1]", // dodixie
        xPath2: "/html/body/div/div[2]/div[1]/main/div[2]/div[3]/div[1]/div/div[5]/h3/div/div/p[2]"
      }
    ];

    let result = '';
    
    pairs.forEach(pair => {
      const result1 = document.evaluate(pair.xPath1, document, null, XPathResult.STRING_TYPE, null).stringValue || 'N/A';
      const result2 = document.evaluate(pair.xPath2, document, null, XPathResult.STRING_TYPE, null).stringValue || 'N/A';
      result += result2 + " from " + result1 + ".\n"; // Add period at the end of each line
    });

    return {
      header: header,
      numbers: result.trim()
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      header: 'Error fetching header',
      numbers: 'Error fetching numbers'
    };
  }
}

// Function to copy text to clipboard and show notification
function copyToClipboard(text) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  // Show the "Copied!" notification
  const notification = document.getElementById('copyNotification');
  notification.classList.add('show'); // Add the 'show' class to display the notification

  // Hide the notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove('show'); // Remove the 'show' class to hide the notification
  }, 2000); // 2000 milliseconds = 2 seconds
}
