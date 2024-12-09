class WaveAnimation {
  constructor() {
    this.svg = document.getElementById('waveContainer');
    this.path = document.getElementById('wavePath');
    this.width = 800;
    this.height = 200;
    this.centerY = this.height / 2;
    this.amplitude = 50;
    this.activeVoices = [];
    this.audioManager = new AudioManager();
    this.dialogOpen = false; // Track if the dialog is open

    this.setupControls();
    this.setupFooterResizing();
    this.animate();
    this.updateVoiceCount();
    this.setupThemeToggle(); // Setup theme toggle
  }

  setupControls() {
    this.baseFreqInput = document.getElementById('baseFreq');
    this.voicesContainer = document.getElementById('activeVoices');

    // Playback controls
    this.playBtn = document.getElementById('playBtn');
    this.pauseBtn = document.getElementById('pauseBtn');

    this.playBtn.addEventListener('click', () => this.play());
    this.pauseBtn.addEventListener('click', () => this.pause());

    this.baseFreqInput.addEventListener('change', () => {
      this.audioManager.updateFrequencies(this.baseFreqInput.value);
    });

    // Generate controls dynamically
    this.generateControls();

    // Info toggle
    const infoButton = document.getElementById('infoButton');
    const infoContent = document.getElementById('infoContent');
    infoButton.addEventListener('click', () => {
      this.toggleSection(infoButton, infoContent);
    });
  }

  setupFooterResizing() {
    const footer = document.querySelector('.footer');
    const resizeHandle = document.querySelector('.resize-handle');
    const spacer = document.getElementById('spacer');
    let isResizing = false;
    let startY, startHeight;

    const updateSpacerHeight = () => {
      spacer.style.height = `${footer.offsetHeight}px`;
    };

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = parseInt(document.defaultView.getComputedStyle(footer).height, 10);
      document.documentElement.addEventListener('mousemove', doDrag, false);
      document.documentElement.addEventListener('mouseup', stopDrag, false);
    });

    const doDrag = (e) => {
      if (!isResizing) return;
      const newHeight = startHeight + (startY - e.clientY);
      const maxHeight = window.innerHeight - 100; // Ensure footer doesn't exceed window height
      if (newHeight > 100 && newHeight < maxHeight) {
        footer.style.height = `${newHeight}px`;
        resizeHandle.style.bottom = `${newHeight}px`;  // Adjust handle position
        updateSpacerHeight();
      }
    };

    const stopDrag = () => {
      isResizing = false;
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    window.addEventListener('resize', () => {
      const maxHeight = window.innerHeight - 100; // Ensure footer doesn't exceed window height
      const footerHeight = parseInt(document.defaultView.getComputedStyle(footer).height, 10);
      if (footerHeight > maxHeight) {
        footer.style.height = `${maxHeight}px`;
        resizeHandle.style.bottom = `${maxHeight}px`;
      }
      updateSpacerHeight();
    });

    // Handle touch events for mobile
    resizeHandle.addEventListener('touchstart', (e) => {
      isResizing = true;
      startY = e.touches[0].clientY;
      startHeight = parseInt(document.defaultView.getComputedStyle(footer).height, 10);
      document.body.classList.add('no-scroll'); // Prevent scrolling on mobile
      document.documentElement.addEventListener('touchmove', doDragTouch, false);
      document.documentElement.addEventListener('touchend', stopDragTouch, false);
    });

    const doDragTouch = (e) => {
      if (!isResizing) return;
      const newHeight = startHeight + (startY - e.touches[0].clientY);
      const maxHeight = window.innerHeight - 100; // Ensure footer doesn't exceed window height
      if (newHeight > 100 && newHeight < maxHeight) {
        footer.style.height = `${newHeight}px`;
        resizeHandle.style.bottom = `${newHeight}px`;  // Adjust handle position
        updateSpacerHeight();
      }
    };

    const stopDragTouch = () => {
      isResizing = false;
      document.body.classList.remove('no-scroll'); // Re-enable scrolling on mobile
      document.documentElement.removeEventListener('touchmove', doDragTouch, false);
      document.documentElement.removeEventListener('touchend', stopDragTouch, false);
    };

    // Initial call to set spacer height
    updateSpacerHeight();
  }

  toggleSection(trigger, content) {
    if (content.classList.contains('collapsed')) {
      // Expand
      content.classList.remove('collapsed');
      content.style.maxHeight = content.scrollHeight + 'px';
      trigger.classList.add('active');
    } else {
      // Collapse
      content.style.maxHeight = content.scrollHeight + 'px';
      setTimeout(() => {
        content.style.maxHeight = '0';
      }, 0);
      content.classList.add('collapsed');
      trigger.classList.remove('active');
    }
  }

  generateControls() {
    const controlsContainer = document.querySelector('.controls');
    const ordersData = this.getOrdersData();

    ordersData.forEach(order => {
      // Create the order header
      const orderHeader = document.createElement('h3');
      orderHeader.classList.add('order-header');
      orderHeader.textContent = order.orderName;

      // Add toggle arrow
      const toggleIcon = document.createElement('span');
      toggleIcon.classList.add('toggle-icon');
      toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';

      orderHeader.prepend(toggleIcon);
      orderHeader.addEventListener('click', () => {
        this.toggleSection(orderHeader, orderContent);
        toggleIcon.innerHTML = orderContent.classList.contains('collapsed') ? '<i class="fas fa-chevron-right"></i>' : '<i class="fas fa-chevron-down"></i>';
      });

      // Create a line under the header
      const headerLine = document.createElement('div');
      headerLine.classList.add('header-line');

      // Create the order content container
      const orderContent = document.createElement('div');
      orderContent.classList.add('order-content'); // This will be collapsible

      const levelsDiv = document.createElement('div');
      levelsDiv.classList.add('levels');

      order.levels.forEach((level, levelIndex) => {
        const levelDiv = document.createElement('div');
        levelDiv.classList.add('level');
        levelDiv.style.position = 'relative'; // Set level to relative positioning

        level.fractions.forEach(fraction => {
          if (fraction.display !== '*') {
            const button = document.createElement('button');
            button.classList.add('fraction-button');
            button.dataset.ratio = fraction.ratio;
            button.style.position = 'absolute';
            button.style.left = fraction.position;
            button.style.transform = 'translateX(-50%)';
            button.addEventListener('click', () => this.handleRatioClick(fraction.ratio));
            button.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                button.click();
              }
            });

            const fractionContainer = document.createElement('div');
            fractionContainer.className = 'fraction-container';

            const numerator = document.createElement('span');
            numerator.classList.add('numerator');
            numerator.textContent = fraction.ratio.split('/')[0];

            const fractionLine = document.createElement('span');
            fractionLine.classList.add('fraction-line');

            const denominator = document.createElement('span');
            denominator.classList.add('denominator');
            denominator.textContent = fraction.ratio.split('/')[1];

            fractionContainer.appendChild(numerator);
            fractionContainer.appendChild(fractionLine);
            fractionContainer.appendChild(denominator);

            button.appendChild(fractionContainer);
            levelDiv.appendChild(button);
          } else {
            // Placeholder to display vertical line
            const placeholder = document.createElement('div');
            placeholder.classList.add('placeholder');
            placeholder.style.position = 'absolute';
            placeholder.style.left = fraction.position;
            placeholder.style.transform = 'translateX(-50%)';
            levelDiv.appendChild(placeholder);
          }
        });

        levelsDiv.appendChild(levelDiv);
      });

      orderContent.appendChild(levelsDiv);

      // Append elements to the controls container
      controlsContainer.appendChild(orderHeader);
      controlsContainer.appendChild(headerLine);
      controlsContainer.appendChild(orderContent);

      // Initialize order content
      orderContent.style.maxHeight = orderContent.scrollHeight + 'px'; // Ensures it's expanded on load
    });
  }

  getOrdersData() {
    return [
      {
        orderName: 'First Order',
        levels: [
          {
            fractions: [
              { ratio: '1/1', display: '1/1', position: '20%' },
              { ratio: '2/1', display: '2/1', position: '40%' },
              { ratio: '3/1', display: '3/1', position: '60%' },
              { ratio: '5/1', display: '5/1', position: '80%' },
            ]
          }
        ]
      },
      {
        orderName: 'Second Order',
        levels: [
          {
            fractions: [{ ratio: '3/2', display: '3/2', position: '50%' }]
          },
          {
            fractions: [
              { ratio: '5/4', display: '5/4', position: '25%' },
              { ratio: '6/4', display: '*', position: '50%' }, // Placeholder
              { ratio: '7/4', display: '7/4', position: '75%' }
            ]
          },
          {
            fractions: [
              { ratio: '9/8', display: '9/8', position: '12.5%' },
              { ratio: '10/8', display: '*', position: '25%' }, // Placeholder
              { ratio: '11/8', display: '11/8', position: '37.5%' },
              { ratio: '12/8', display: '*', position: '50%' }, // Placeholder
              { ratio: '13/8', display: '13/8', position: '62.5%' },
              { ratio: '14/8', display: '*', position: '75%' }, // Placeholder
              { ratio: '15/8', display: '15/8', position: '87.5%' }
            ]
          }
        ]
      },
      {
        orderName: 'Third Order',
        levels: [
          {
            fractions: [
              { ratio: '4/3', display: '4/3', position: '33.3%' },
              { ratio: '5/3', display: '5/3', position: '66.6%' }
            ]
          },
          {
            fractions: [
              { ratio: '10/9', display: '10/9', position: '11.1%' },
              { ratio: '11/9', display: '11/9', position: '22.2%' },
              { ratio: '12/9', display: '*', position: '33.3%' }, // Placeholder
              { ratio: '13/9', display: '13/9', position: '44.4%' },
              { ratio: '14/9', display: '14/9', position: '55.5%' },
              { ratio: '15/9', display: '*', position: '66.6%' }, // Placeholder
              { ratio: '16/9', display: '16/9', position: '77.7%' },
              { ratio: '17/9', display: '17/9', position: '88.8%' }
            ]
          }
        ]
      },
      {
        orderName: 'Fifth Order',
        levels: [
          {
            fractions: [
              { ratio: '6/5', display: '6/5', position: '20%' },
              { ratio: '7/5', display: '7/5', position: '40%' },
              { ratio: '8/5', display: '8/5', position: '60%' },
              { ratio: '9/5', display: '9/5', position: '80%' }
            ]
          }
        ]
      }
    ];
  }

  play() {
    this.audioManager.play();
    this.playBtn.disabled = true;
    this.pauseBtn.disabled = false;
    this.playBtn.classList.add('active');
    this.pauseBtn.classList.remove('active');
  }

  pause() {
    this.audioManager.pause();
    this.playBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.playBtn.classList.remove('active');
    this.pauseBtn.classList.add('active');
  }

  updateVoiceCount() {
    const count = document.getElementById('voiceCount');
    count.textContent = `(${this.activeVoices.length})`;
  }

  handleRatioClick(ratio) {
    this.addVoice(ratio);
  }

  addVoice(ratio) {
    const voiceId = this.audioManager.addVoice(ratio, this.baseFreqInput.value);

    const voiceElement = document.createElement('div');
    voiceElement.className = 'voice';
    voiceElement.dataset.ratio = ratio;
    voiceElement.dataset.voiceId = voiceId;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    const upArrow = document.createElement('button');
    upArrow.className = 'up-arrow';
    upArrow.innerHTML = '<i class="fas fa-arrow-up"></i>';
    upArrow.addEventListener('click', () => this.modifyFraction(voiceElement, 'up'));

    const downArrow = document.createElement('button');
    downArrow.className = 'down-arrow';
    downArrow.innerHTML = '<i class="fas fa-arrow-down"></i>';
    downArrow.addEventListener('click', () => this.modifyFraction(voiceElement, 'down'));

    controlsContainer.appendChild(upArrow);
    controlsContainer.appendChild(downArrow);

    const fractionContainer = document.createElement('div');
    fractionContainer.className = 'fraction-container';
    fractionContainer.addEventListener('click', () => this.openFractionDialog(voiceElement));

    const numerator = document.createElement('span');
    numerator.classList.add('numerator');
    numerator.textContent = ratio.split('/')[0];

    const fractionLine = document.createElement('span');
    fractionLine.classList.add('fraction-line');

    const denominator = document.createElement('span');
    denominator.classList.add('denominator');
    denominator.textContent = ratio.split('/')[1];

    fractionContainer.appendChild(numerator);
    fractionContainer.appendChild(fractionLine);
    fractionContainer.appendChild(denominator);

    voiceElement.appendChild(controlsContainer);
    voiceElement.appendChild(fractionContainer);

    const removeButton = document.createElement('button');
    removeButton.className = 'remove';
    removeButton.setAttribute('aria-label', `Remove ${ratio}`);
    removeButton.innerHTML = '<i class="fas fa-times"></i>';
    removeButton.addEventListener('click', () => this.removeVoice(voiceElement));

    voiceElement.appendChild(removeButton);

    this.voicesContainer.appendChild(voiceElement);
    this.activeVoices.push({ ratio, element: voiceElement, voiceId });
    this.updateVoiceCount();
  }

  modifyFraction(voiceElement, direction) {
    const fractionContainer = voiceElement.querySelector('.fraction-container');
    let numerator = parseInt(fractionContainer.querySelector('.numerator').textContent);
    let denominator = parseInt(fractionContainer.querySelector('.denominator').textContent);
  
    if (direction === 'up') {
      numerator *= 2;
    } else if (direction === 'down') {
      denominator *= 2;
    }
  
    const simplified = this.simplifyFraction(numerator, denominator);
  
    fractionContainer.querySelector('.numerator').textContent = simplified.numerator;
    fractionContainer.querySelector('.denominator').textContent = simplified.denominator;
  
    // Update the ratio in the dataset
    voiceElement.dataset.ratio = `${simplified.numerator}/${simplified.denominator}`;
  
    // Update the audio manager
    const voiceId = voiceElement.dataset.voiceId;
    this.audioManager.updateVoice(voiceId, simplified.numerator, simplified.denominator, this.baseFreqInput.value);
  
    // Update the activeVoices array
    const voiceIndex = this.activeVoices.findIndex(v => v.voiceId == voiceId);
    if (voiceIndex !== -1) {
      this.activeVoices[voiceIndex].ratio = `${simplified.numerator}/${simplified.denominator}`;
    }
  
    // Ensure the animation updates
    this.path.setAttribute('d', `M ${this.calculateWavePoints(0)}`);
  }

  simplifyFraction(numerator, denominator) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(numerator, denominator);
    return {
      numerator: numerator / divisor,
      denominator: denominator / divisor,
    };
  }

  openFractionDialog(voiceElement) {
    if (this.dialogOpen) return; // Prevent opening multiple dialogs
  
    const fractionContainer = voiceElement.querySelector('.fraction-container');
    const numerator = fractionContainer.querySelector('.numerator').textContent;
    const denominator = fractionContainer.querySelector('.denominator').textContent;
  
    const dialog = document.createElement('div');
    dialog.className = 'fraction-dialog';
  
    dialog.innerHTML = `
      <div class="dialog-content">
        <label>Numerator: <input type="number" id="dialogNumerator" value="${numerator}"></label>
        <label>Denominator: <input type="number" id="dialogDenominator" value="${denominator}"></label>
        <button id="dialogSave">Save</button>
        <button id="dialogCancel">Cancel</button>
      </div>
    `;
  
    document.body.appendChild(dialog);
    this.dialogOpen = true;
  
    const closeDialog = () => {
      dialog.remove();
      this.dialogOpen = false;
      document.removeEventListener('click', handleOutsideClick);
    };
  
    const handleOutsideClick = (event) => {
      if (!dialog.contains(event.target) && event.target !== fractionContainer) {
        closeDialog();
      }
    };
  
    document.getElementById('dialogSave').addEventListener('click', () => {
      const newNumerator = parseInt(document.getElementById('dialogNumerator').value);
      const newDenominator = parseInt(document.getElementById('dialogDenominator').value);
      const simplified = this.simplifyFraction(newNumerator, newDenominator);
  
      fractionContainer.querySelector('.numerator').textContent = simplified.numerator;
      fractionContainer.querySelector('.denominator').textContent = simplified.denominator;
  
      // Update the ratio in the dataset
      voiceElement.dataset.ratio = `${simplified.numerator}/${simplified.denominator}`;
  
      // Update the audio manager
      const voiceId = voiceElement.dataset.voiceId;
      this.audioManager.updateVoice(voiceId, simplified.numerator, simplified.denominator, this.baseFreqInput.value);
  
      // Update the activeVoices array
      const voiceIndex = this.activeVoices.findIndex(v => v.voiceId == voiceId);
      if (voiceIndex !== -1) {
        this.activeVoices[voiceIndex].ratio = `${simplified.numerator}/${simplified.denominator}`;
      }
  
      // Ensure the animation updates
      this.path.setAttribute('d', `M ${this.calculateWavePoints(0)}`);
  
      closeDialog();
    });
  
    document.getElementById('dialogCancel').addEventListener('click', () => {
      closeDialog();
    });
  
    // Add event listener to close dialog when clicking outside
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0); // Delay to ensure the click event is not triggered immediately
  }

  removeVoice(voiceElement) {
    const voiceId = voiceElement.dataset.voiceId;
    voiceElement.remove();

    // Remove one instance of the voice
    const index = this.activeVoices.findIndex(v => v.voiceId == voiceId);
    if (index !== -1) {
      this.activeVoices.splice(index, 1);
    }

    this.audioManager.removeVoiceById(voiceId);
    this.updateVoiceCount();
  }

  calculateWavePoints(time) {
    const points = [];
    const segments = 800;

    // Handle the case when there are no active voices
    if (this.activeVoices.length === 0) {
      // Draw a flat line at centerY
      points.push(`0,${this.centerY}`);
      points.push(`${this.width},${this.centerY}`);
      return points.join(' ');
    }

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * this.width;
      let yValue = 0;

      this.activeVoices.forEach(voice => {
        const [numerator, denominator] = voice.ratio.split('/').map(Number);
        const frequency = 4 * (numerator / denominator); // Multiply for more interesting display
        yValue += Math.sin(frequency * ((2 * Math.PI * i) / segments) + time * frequency);
      });

      // Sum of waves, centered vertically
      const y = this.centerY - yValue * (this.amplitude / this.activeVoices.length);

      points.push(`${x},${y}`);
    }

    return points.join(' ');
  }

  animate() {
    let time = 0;
    const animate = () => {
      const points = this.calculateWavePoints(time);
      this.path.setAttribute('d', `M ${points}`);
      time += 0.05;
      requestAnimationFrame(animate);
    };
    animate();
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
    });
  }
}

// Initialize the wave animation when the page loads
let waveAnimation;
window.addEventListener('load', () => {
  waveAnimation = new WaveAnimation();
});