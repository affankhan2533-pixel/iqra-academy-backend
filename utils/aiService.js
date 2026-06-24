const mongoose = require('mongoose');
const Note = require('../models/Note');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');

// Retrieve API keys from env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Searches MongoDB study materials (Notes) for relevant context (RAG simulation).
 */
const getNoteContext = async (query, className) => {
  try {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    if (searchTerms.length === 0) return '';

    // Build regex queries for notes matching the student's class
    const orQuery = searchTerms.map(term => ({
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { subject: { $regex: term, $options: 'i' } }
      ]
    }));

    const matchingNotes = await Note.find({
      class: className,
      $or: orQuery
    }).limit(3);

    if (matchingNotes.length === 0) return '';

    let context = '\n[INSTITUTE KNOWLEDGE BASE CONTEXT]\n';
    matchingNotes.forEach(note => {
      context += `Note Title: ${note.title}\nSubject: ${note.subject}\nContent Summary: ${note.description}\nLink: ${note.fileUrl}\n\n`;
    });
    return context;
  } catch (error) {
    console.error('Error fetching RAG notes context:', error);
    return '';
  }
};

/**
 * Dynamic fallback study assistant that structures customized lessons for miscellaneous queries.
 */
const generateDynamicLesson = (query, subject, className) => {
  const clean = query.replace(/[?.,!]/g, '').trim();
  const terms = clean.split(/\s+/).filter(t => t.length > 3);
  const mainTerm = terms[0] ? terms[0].charAt(0).toUpperCase() + terms[0].slice(1) : 'Academic Concept';
  const secondaryTerm = terms[1] ? terms[1].toLowerCase() : '';
  const subjectName = subject || 'Science/Mathematics';
  const cls = className || 'Class 12 Science';

  return `### **Study Guide: ${mainTerm} ${secondaryTerm ? 'and ' + secondaryTerm : ''}**
*Welcome to the Hi-Fi Classes Virtual Classroom. Let's study this topic for ${cls}.*

#### **1. Core Concept Overview**
When studying **${mainTerm}** in the context of **${subjectName}**, we focus on understanding the fundamental properties, experimental layouts, and theories that describe this system.
* **Key Definition:** The scientific mechanism or mathematical model detailing the behavior, state changes, and properties of this topic.
* **Coaching Tip:** Board exams frequently require both the conceptual explanation and the related formula derivations.

#### **2. Formula Sheet & Analytical Calculations**
Let's represent the quantitative relationships mathematically:
* **Primary Relationship:**
  $$X_{\\text{final}} = X_{\\text{initial}} \\cdot K_{\\text{constant}}$$
* **Rate of Evolution:**
  $$\\frac{d}{dt}[\\text{System}] = \\gamma \\cdot (\\text{Input} - \\text{Loss})$$
  *(Note: Always verify boundary conditions and check standard units before performing numerical operations.)*

#### **3. Step-by-Step Solved Problem**
* **Problem:** Calculate the total output change of a system governed by **${mainTerm}** principles when the rate constant doubles from $5$ to $10 \\text{ units/sec}$ over a period of $4$ seconds.
* **Solution:**
  1. Identify given values: $t = 4\\text{ seconds}$, rate $= 1.25 \\text{ units/sec}$.
  2. Substitute into formula:
     $$\\Delta = \\text{rate} \\times t = 1.25 \\times 4 = 5.0\\text{ units}$$
  3. The net change is exactly $5.0\\text{ units}$.

#### **4. Revision Guidelines & Exam Hacks**
* **Tip 1:** Draw neat block flowcharts showing the states of **${mainTerm}**. Correctly labeled diagrams secure partial marks in descriptive questions.
* **Tip 2:** Keep a running formula index sheet for this chapter.
* **Tip 3:** Practice past year board papers to understand how this topic is framed in essay questions.`;
};

/**
 * Advanced fallback tutoring engine that generates deep, subject-specific answers.
 */
const generateSimulatedResponse = (query, subject = 'General Science', className) => {
  const q = query.toLowerCase();
  
  // Helper to match keywords as whole words or prefix stems to prevent false substring matches (like 'talk' matching 'alk' or 'photosynthesis' matching 'ph')
  const match = (stems, exact = []) => {
    if (exact.some(w => new RegExp(`\\b${w}\\b`, 'i').test(q))) return true;
    return stems.some(stem => new RegExp(`\\b${stem}`, 'i').test(q));
  };

  // 1. Physics: Newton's Laws
  if (match(['newton', 'motion', 'inertia', 'gravity', 'force'])) {
    return `### **Newton's Laws of Motion Explained**
Hello! Let's break down these fundamental laws of physics. They form the foundation of **Classical Mechanics**.

#### **1. First Law of Motion (Law of Inertia)**
> *“An object remains in a state of rest or of uniform motion in a straight line unless compelled to change that state by an applied force.”*
* **Coaching Tip:** Inertia is directly proportional to mass. A heavier object is harder to push!
* **Real-life Example:** Why you fall forward when a moving bus suddenly brakes.

#### **2. Second Law of Motion (Law of Force & Acceleration)**
> *“The rate of change of momentum of an object is proportional to the applied unbalanced force in the direction of the force.”*
* **Mathematical Derivation:**
  $$\\text{Momentum } (p) = m \\times v$$
  $$F \\propto \\frac{dp}{dt} \\implies F = k \\cdot m \\cdot \\frac{dv}{dt}$$
  $$F = m \\cdot a \\quad (\\text{where } k=1 \\text{ in S.I. units})$$
* **Units:** $1 \\text{ Newton (N)} = 1 \\text{ kg} \\cdot \\text{m/s}^2$.

#### **3. Third Law of Motion (Law of Action & Reaction)**
> *“To every action, there is always an equal and opposite reaction.”*
* **Key Concept:** Forces always occur in pairs. Action and reaction act on **different** bodies.
* **Example:** Recoil of a gun; rocket propulsion (expelling exhaust gases downward forces the rocket upward).

---
#### **Practice Numerical:**
*Question:* A force of $15\\text{ N}$ acts on a mass of $3\\text{ kg}$. What is the acceleration produced?
*Solution:*
Using $F = ma \\implies a = \\frac{F}{m}$
$$a = \\frac{15\\text{ N}}{3\\text{ kg}} = 5\\text{ m/s}^2$$`;
  }

  // 2. Physics: Electrostatics
  if (match(['electrostatics', 'coulomb', 'charge', 'field', 'gauss', 'capacitor'])) {
    return `### **Class 12 Physics: Electrostatics Quick Revision**
Let's review key concepts of Electrostatics, which deal with forces, fields, and potentials arising from static charges.

#### **1. Coulomb's Law:**
The force between two point charges $q_1$ and $q_2$ separated by a distance $r$ in vacuum is:
$$F = \\frac{1}{4\\pi\\varepsilon_0} \\cdot \\frac{q_1 q_2}{r^2}$$
* **Constant value:** $\\frac{1}{4\\pi\\varepsilon_0} \\approx 9 \\times 10^9 \\text{ N}\\cdot\\text{m}^2/\\text{C}^2$.
* $\\varepsilon_0$ is the permittivity of free space ($8.854 \\times 10^{-12} \\text{ F/m}$).

#### **2. Electric Field Intensity ($E$):**
Electric field due to a point charge $q$ is:
$$E = \\frac{F}{q_0} = \\frac{1}{4\\pi\\varepsilon_0} \\cdot \\frac{q}{r^2}$$

#### **3. Gauss's Law:**
The total electric flux $\\Phi$ through any closed surface is $\\frac{1}{\\varepsilon_0}$ times the net charge enclosed by the surface:
$$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enclosed}}}{\\varepsilon_0}$$

#### **4. Capacitance:**
For a parallel-plate capacitor:
$$C = \\frac{\\varepsilon_0 A}{d}$$
* With a dielectric constant $K$, capacitance becomes $C' = K \\cdot C$.`;
  }

  // 3. Physics: Optics
  if (match(['optics', 'lens', 'mirror', 'reflection', 'refraction', 'snell', 'prism'])) {
    return `### **Physics: Optics & Ray Diagrams**
Optics describes the behavior of light and its interactions with matter. Let's cover key concepts:

#### **1. Laws of Reflection & Refraction:**
* **Reflection:** The angle of incidence equals the angle of reflection ($\\theta_i = \\theta_r$).
* **Snell's Law of Refraction:**
  $$\\frac{\\sin i}{\\sin r} = \\frac{n_2}{n_1}$$
  *Where $n_1$ and $n_2$ are refractive indices of Medium 1 and Medium 2 respectively.*

#### **2. Lens Maker's Formula:**
Defines the focal length $f$ of a thin lens based on curvature radii $R_1, R_2$:
$$\\frac{1}{f} = (n - 1) \\left( \\frac{1}{R_1} - \\frac{1}{R_2} \\right)$$

#### **3. Mirror Formula & Thin Lens Equation:**
* **Mirror Formula:** $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$
* **Lens Formula:** $\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}$
* *Sign Convention rule: Distance in direction of incident light is positive, opposite is negative.*`;
  }

  // 4. Chemistry: Organic Chemistry
  if (match(['organic', 'carbon', 'reaction', 'iupac', 'alk'])) {
    return `### **Organic Chemistry: Core Concepts and Mechanisms**
Organic Chemistry is the study of carbon compounds. Carbon has two unique properties: **Catenation** (self-linking) and **Tetravalency** ($4$ valence electrons).

#### **1. Major Reaction Types you MUST know:**
* **Nucleophilic Substitution ($S_N1$ vs $S_N2$):**
  * **$S_N1$:** 2-step process, tertiary carbocation intermediate, racemization. Rate $= k[\\text{Substrate}]$.
  * **$S_N2$:** 1-step concerted process, pentavalent transition state, inversion of configuration (Walden Inversion). Rate $= k[\\text{Substrate}][\\text{Nucleophile}]$.
* **Electrophilic Aromatic Substitution (EAS):** Benzene ring reacts with electrophiles (e.g., Nitration, Halogenation, Friedel-Crafts Alkylation/Acylation).

#### **2. Quick Reference Table: Inductive & Resonance Effects**
* **$+I$ (Electron Donating):** Alkyl groups ($-\\text{CH}_3$, $-\text{C}_2\\text{H}_5$). Stabilizes carbocations.
* **$-I$ (Electron Withdrawing):** Halogens ($-\\text{F}$, $-\\text{Cl}$), $-\\text{NO}_2$, $-\\text{COOH}$.
* **$+R$ / $+M$ (Resonance Donating):** $-\\text{OH}$, $-\\text{NH}_2$ (lone pair on direct atom triggers activating/ortho-para directing nature on benzene).

*Advice:* Always practice named reactions like Aldol Condensation, Cannizzaro Reaction, and Sandmeyer Reaction!`;
  }

  // 5. Chemistry: Acids and Bases
  if (match(['acid', 'base', 'buffer', 'titration', 'salt'], ['ph'])) {
    return `### **Chemistry: Acids, Bases and pH Calculations**
Let's review the fundamental definitions and calculations for acidic and basic solutions.

#### **1. Theories of Acids and Bases:**
* **Arrhenius:** Acids produce $H^+$ in water; Bases produce $OH^-$.
* **Bronsted-Lowry:** Acids are proton donors; Bases are proton acceptors.
* **Lewis:** Acids are electron-pair acceptors; Bases are electron-pair donors.

#### **2. pH Calculation Equations:**
* **pH definition:**
  $$\\text{pH} = -\\log_{10} [H^+]$$
* **pOH definition:**
  $$\\text{pOH} = -\\log_{10} [OH^-]$$
* **Relationship:** $\\text{pH} + \\text{pOH} = 14 \\quad (\\text{at } 25^\\circ\\text{C})$.

#### **3. Buffer Solutions:**
Buffer solutions resist changes in pH. Henderson-Hasselbalch equation for acidic buffer:
$$\\text{pH} = \\text{p}K_a + \\log_{10} \\left( \\frac{[\\text{Salt}]}{[\\text{Acid}]} \\right)$$`;
  }

  // 6. Chemistry: Atomic Structure
  if (match(['atom', 'molecule', 'periodic', 'electron', 'quantum', 'shell'])) {
    return `### **Chemistry: Atomic Structure & Electron Configurations**
Understanding atomic structure is crucial for mastering chemical bonding and periodic trends.

#### **1. Quantum Numbers:**
1. **Principal ($n$):** Shell size and energy level ($n = 1, 2, 3...$).
2. **Azimuthal ($l$):** Subshell shape ($l = 0 \\text{ for s}, 1 \\text{ for p}, 2 \\text{ for d}, 3 \\text{ for f}$).
3. **Magnetic ($m_l$):** Orbital orientation ($m_l = -l \\text{ to } +l$).
4. **Spin ($m_s$):** Electron spin orientation ($+1/2 \\text{ or } -1/2$).

#### **2. Rules for Filling Orbitals:**
* **Aufbau Principle:** Orbitals are filled in order of increasing energy ($1s \\to 2s \\to 2p \\to 3s...$).
* **Pauli Exclusion Principle:** No two electrons in an atom can have the same four quantum numbers.
* **Hund's Rule:** Orbitals of equal energy are singly occupied before pairing up.

#### **3. Periodic Trends:**
* **Atomic Radius:** Decreases left-to-right across a period, increases down a group.
* **Ionization Energy:** Increases left-to-right across a period, decreases down a group.`;
  }

  // 7. Chemistry: Thermodynamics
  if (match(['thermodynamics', 'entropy', 'enthalpy', 'carnot', 'gas', 'heat'])) {
    return `### **Physical Chemistry: Thermodynamics Review**
Thermodynamics deals with the relationships between heat, work, temperature, and energy.

#### **1. The Three Laws:**
* **First Law:** Energy cannot be created or destroyed:
  $$\\Delta U = q + w$$
* **Second Law:** The total entropy of an isolated system always increases over time: $\\Delta S_{\\text{total}} > 0$.
* **Third Law:** The entropy of a pure crystalline substance at absolute zero is zero.

#### **2. Gibbs Free Energy ($G$):**
Predicts reaction spontaneity under constant temperature and pressure:
$$\\Delta G = \\Delta H - T\\Delta S$$
* **$\\Delta G < 0$:** Spontaneous reaction (exergonic).
* **$\\Delta G > 0$:** Non-spontaneous reaction (endergonic).
* **$\\Delta G = 0$:** System at chemical equilibrium.`;
  }

  // 8. Biology: Photosynthesis
  if (match(['photosynthesis', 'chloroplast', 'light reaction', 'calvin', 'plant'])) {
    return `### **Photosynthesis: Detailed Mechanism**
Photosynthesis is the process by which green plants construct organic compounds (glucose) from raw inorganic materials ($CO_2$ and $H_2O$) in the presence of sunlight and chlorophyll.

#### **Chemical Equation:**
$$6CO_2 + 12H_2O \\xrightarrow[\\text{Chlorophyll}]{\\text{Sunlight}} C_6H_{12}O_6 + 6O_2 + 6H_2O$$

#### **The Two Main Stages:**

| Stage | Process | Location | Inputs | Outputs |
| :--- | :--- | :--- | :--- | :--- |
| **Light Reaction** (Photochemical) | Photolysis of water, ATP & NADPH formation | Grana (Thylakoids) | Light, $H_2O$, NADP+, ADP | $O_2$, ATP, NADPH |
| **Dark Reaction** (Calvin Cycle) | Carbon fixation, reduction, regeneration | Stroma | $CO_2$, ATP, NADPH | Glucose ($C_6H_{12}O_6$) |

#### **Key Coaching Points to Remember for Exams:**
1. **Photolysis of Water:** Occurs at PS-II (Photosystem II), splitting $H_2O$ into protons, electrons, and oxygen.
2. **RuBisCO:** The enzyme responsible for carbon fixation in $C_3$ plants. It is the most abundant protein on Earth!
3. **Factors Affecting Rate:** Light intensity, carbon dioxide concentration, temperature, and water availability.`;
  }

  // 9. Biology: Cell Division
  if (match(['mitosis', 'meiosis', 'cell division', 'chromosome', 'prophase', 'metaphase', 'anaphase'])) {
    return `### **Biology: Cell Division (Mitosis & Meiosis)**
Cell division is the biological process by which a parent cell divides into two or more daughter cells.

#### **1. Mitosis (Equational Division):**
Occurs in somatic cells. Results in 2 genetically identical diploid ($2n$) daughter cells.
* **Prophase:** Chromatin condenses into chromosomes; nuclear membrane disappears.
* **Metaphase:** Chromosomes align along the equatorial metaphase plate. Spindle fibers attach to centromeres.
* **Anaphase:** Sister chromatids are pulled apart to opposite poles.
* **Telophase:** Nuclear envelope reforms around daughter chromosomes. Cytokinesis divides cytoplasm.

#### **2. Meiosis (Reduction Division):**
Occurs in germ cells to produce gametes. Results in 4 genetically distinct haploid ($n$) cells.
* **Meiosis I:** Homologous chromosomes separate. Crossing over (exchange of genetic material) occurs during **Prophase I (Pachytene stage)**, introducing genetic variation!
* **Meiosis II:** Sister chromatids separate (similar to mitosis).`;
  }

  // 10. Biology: Respiration
  if (match(['respiration', 'krebs', 'glycolysis', 'mitochondria'], ['atp'])) {
    return `### **Biology: Cellular Respiration & ATP Production**
Cellular respiration is a set of metabolic reactions that convert chemical energy from nutrients into Adenosine Triphosphate (ATP).

#### **1. Overview of Aerobic Respiration:**
$$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 36 \\text{ to } 38 \\text{ ATP}$$

#### **2. Three Main Metabolic Pathways:**
1. **Glycolysis (Anaerobic):** Occurs in the **Cytoplasm**. Converts 1 glucose molecule into 2 pyruvates, yielding a net of $2\\text{ ATP}$ and $2\\text{ NADH}$.
2. **Krebs Cycle (TCA Cycle):** Occurs in the **Mitochondrial Matrix**. Requires oxygen. Pyruvate is converted to Acetyl-CoA, producing $CO_2$, ATP, NADH, and $FADH_2$.
3. **Electron Transport Chain (ETC):** Occurs on the **Inner Mitochondrial Membrane (Cristae)**. Oxygen acts as the final electron acceptor. Generates approximately $32\\text{ to }34\\text{ ATP}$ via oxidative phosphorylation.`;
  }

  // 11. Mathematics: Trigonometry
  if (match(['trig', 'sine', 'cosine', 'tangent', 'angle', 'identity'])) {
    return `### **Trigonometric Identites & Proof Solutions Guide**
Trigonometry is highly structured. Once you master the relationships, it becomes a scoring section!

#### **Core Identities (Must Memorize):**
1. **Pythagorean Identities:**
   * $\\sin^2 \\theta + \\cos^2 \\theta = 1$
   * $1 + \\tan^2 \\theta = \\sec^2 \\theta$
   * $1 + \\cot^2 \\theta = \\csc^2 \\theta$
2. **Double Angle Formulas:**
   * $\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$
   * $\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1 = 1 - 2\\sin^2\\theta$

#### **Step-by-Step Proof Solution Example:**
*Question:* Prove that $\\frac{1 - \\cos(2\\theta)}{\\sin(2\\theta)} = \\tan\\theta$.
*Proof:*
* **L.H.S:** $\\frac{1 - \\cos(2\\theta)}{\\sin(2\\theta)}$
* Substitute double-angle identities:
  * $1 - \\cos(2\\theta) = 2\\sin^2\\theta$
  * $\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$
* Substitute these into L.H.S:
  $$\\text{L.H.S} = \\frac{2\\sin^2\\theta}{2\\sin\\theta\\cos\\theta}$$
* Cancel the $2$ and one factor of $\\sin\\theta$:
  $$\\text{L.H.S} = \\frac{\\sin\\theta}{\\cos\\theta} = \\tan\\theta = \\text{R.H.S}$$
* Hence Proved!`;
  }

  // 12. Mathematics: Calculus
  if (match(['calculus', 'derivative', 'integration', 'limit', 'continuity', 'slope', 'matrix', 'vector'])) {
    return `### **Mathematics: Calculus (Limits, Derivatives & Integration)**
Calculus studies continuous change. Let's cover key rules and formulas:

#### **1. Differentiation Rules:**
* **Power Rule:** $\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}$
* **Product Rule:** $\\frac{d}{dx}(u \\cdot v) = u \\frac{dv}{dx} + v \\frac{du}{dx}$
* **Quotient Rule:** $\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{v \\frac{du}{dx} - u \\frac{dv}{dx}}{v^2}$
* **Chain Rule:** $\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$

#### **2. Standard Integrals:**
* $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)$
* $\\int \\frac{1}{x} \\, dx = \\ln|x| + C$
* $\\int e^x \\, dx = e^x + C$

#### **3. Definitive Integral Problem:**
*Question:* Solve $\\int_{1}^{3} (3x^2 + 2x) \\, dx$.
*Solution:*
1. Find the indefinite integral: $\\int (3x^2 + 2x) \\, dx = x^3 + x^2$.
2. Apply limits from $1$ to $3$:
   $$[3^3 + 3^2] - [1^3 + 1^2] = [27 + 9] - [1 + 1] = 36 - 2 = 34$$`;
  }

  // Default Fallback: Generate dynamic structured lesson
  return generateDynamicLesson(query, subject, className);
};

/**
 * Main AI Query Interface.
 * Calls Google Gemini (primary fallback) or OpenAI API (if configured), otherwise uses simulated parser.
 */
exports.askAI = async (query, subject, className) => {
  const context = await getNoteContext(query, className);
  const systemPrompt = `You are a highly experienced and friendly coaching teacher at "Hi-Fi Classes", coaching students of Class 10, Class 11 Science, and Class 12 Science.
Your goal is to explain concepts clearly, provide step-by-step derivations/solutions, write formulas in clean Markdown LaTeX notation (like $E=mc^2$ or $$F=ma$$), and include study tips. 
You are teaching the subject: ${subject || 'Science/Mathematics'}. The student is in class: ${className || 'Class 12 Science'}.
Always respond like an empathetic, elite mentor. Make your answers structured, utilizing headings, bold text, bullet points, tables, and numerical examples.
${context}`;

  // 1. Try Google Gemini API first (rest query - zero dependency)
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${query}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.warn('Gemini API returned empty candidates array. Falling back.');
      }
    } catch (error) {
      console.error('Google Gemini API request failed:', error);
    }
  }

  // 2. Try OpenAI API
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('OpenAI API request failed:', error);
    }
  }

  // 3. Fallback to simulated tutor
  return generateSimulatedResponse(query, subject, className);
};

/**
 * Summarizes notes text/document.
 */
exports.summarizeNotes = async (fileName, textContent) => {
  const fileDesc = fileName || 'Uploaded Document';
  const promptText = `Please summarize this study material named "${fileDesc}" by generating Revision Notes, Formula Sheets, Key Definitions, and a Quick Revision Guide.\nContent preview:\n${textContent || 'Mock notes content on scientific principles'}`;

  // 1. Try Google Gemini API
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI Notes Summarizer. Generate highly structured Revision Notes, Formula Sheets, Key Definitions, and a Quick Revision Guide.\n\n${promptText}`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error('Gemini Summarizer failed:', error);
    }
  }
  
  // 2. Try OpenAI API
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI Notes Summarizer. Generate highly structured Revision Notes, Formula Sheets, Key Definitions, and a Quick Revision Guide.'
            },
            {
              role: 'user',
              content: promptText
            }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('OpenAI Notes Summarizer error:', error);
    }
  }

  // Simulated Summary Sheet Fallback
  return `## **AI Notes Summary: ${fileDesc}**
*Generated by Hi-Fi Classes AI Notes Summarizer*

### 📝 **Quick Overview**
This study guide outlines core principles, derivations, and formulas of the chapter, highlighting exam-oriented questions and definitions.

### 🔑 **Key Definitions**
1. **Core Concept:** A primary law or principle defining the relationship between inputs and outputs in physical systems.
2. **Equilibrium State:** A condition where opposing forces or reactions are balanced, resulting in no net change over time.
3. **Limiting Value:** The value that a function approaches as the input approaches some value.

### 📐 **Formula Sheet**
* **Direct Relationship:**
  $$Y = k \\cdot X$$
* **Efficiency Metric:**
  $$\\eta = \\frac{\\text{Output Energy}}{\\text{Input Energy}} \\times 100\\%$$
* **Rate of Change:**
  $$\\frac{dy}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}$$

### 💡 **Quick Revision Guide & Exam Hacks**
* **Tip 1:** Always double-check standard SI units before beginning calculations.
* **Tip 2:** In board exams, drawing neat, labelled diagrams secures at least 25% of the question marks.
* **Tip 3:** Focus heavily on the boundary conditions during integration derivations.`;
};

/**
 * AI Test Generator for Teachers.
 */
exports.generateTestQuestions = async (subject, chapter, difficulty, numQuestions, marks) => {
  // 1. Try Google Gemini API
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI Test Creator. Generate valid, parseable JSON only. No other formatting. The output should be a JSON object with a key "questions" which is an array of question objects. Each question object contains: id, text, type ("MCQ", "Short", "Long", "Numerical"), options (array of strings, only for MCQ), marks, solution.\n\nGenerate a ${difficulty} test for Subject: ${subject}, Chapter: ${chapter}. Total Questions: ${numQuestions}, Total Marks: ${marks}.`
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        try {
          const rawText = data.candidates[0].content.parts[0].text.trim();
          // Strip any potential markdown wrapper ```json ... ```
          const jsonText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
          const parsed = JSON.parse(jsonText);
          if (parsed.questions) return parsed.questions;
        } catch (e) {
          console.warn('Gemini returned invalid JSON test format. Falling back to simulator.');
        }
      }
    } catch (error) {
      console.error('Gemini Test Generator error:', error);
    }
  }

  // 2. Try OpenAI API
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI Test Creator. Generate valid, parseable JSON only. No other formatting. The output should be a JSON object with a key "questions" which is an array of question objects. Each question object contains: id, text, type ("MCQ", "Short", "Long", "Numerical"), options (array of strings, only for MCQ), marks, solution.'
            },
            {
              role: 'user',
              content: `Generate a ${difficulty} test for Subject: ${subject}, Chapter: ${chapter}. Total Questions: ${numQuestions}, Total Marks: ${marks}.`
            }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        try {
          const parsed = JSON.parse(data.choices[0].message.content.trim());
          if (parsed.questions) return parsed.questions;
        } catch (e) {
          console.warn('AI returned invalid JSON test format. Falling back to simulator.');
        }
      }
    } catch (error) {
      console.error('OpenAI Test Generator error:', error);
    }
  }

  // Simulated Test Sheet Generator
  const sampleQuestions = [];
  const marksPerQ = Math.round(marks / numQuestions);
  const sub = subject.toLowerCase();

  if (sub.includes('phys')) {
    // Generate Physics questions
    for (let i = 1; i <= numQuestions; i++) {
      if (i === 1) {
        sampleQuestions.push({
          id: i,
          text: `A particle of mass $m$ in ${chapter} experiences a force $F = -kx$ where $k$ is a constant. Which of the following represents the correct angular frequency $\\omega$ of its motion?`,
          type: 'MCQ',
          options: [
            '$\\omega = \\sqrt{k/m}$',
            '$\\omega = k/m$',
            '$\\omega = \\sqrt{m/k}$',
            '$\\omega = m/k$'
          ],
          marks: 5,
          solution: 'Option A: The equation of motion is $m \\cdot d^2x/dt^2 + kx = 0$, which yields angular frequency $\\omega = \\sqrt{k/m}$.'
        });
      } else if (i === 2) {
        sampleQuestions.push({
          id: i,
          text: `Explain Coulomb's Law and derive the expression for the electric field intensity at a distance $r$ from a point charge in ${chapter}.`,
          type: 'Short',
          options: [],
          marks: marksPerQ,
          solution: 'Coulomb\'s Law states that $F = \\frac{1}{4\\pi\\varepsilon_0} \\cdot \\frac{q_1q_2}{r^2}$. The electric field intensity is force per unit charge: $E = F/q_0 = \\frac{1}{4\\pi\\varepsilon_0} \\cdot \\frac{q}{r^2}$.'
        });
      } else {
        sampleQuestions.push({
          id: i,
          text: `A capacitor of $10\\mu\\text{F}$ is charged to $50\\text{ V}$. Calculate the electrostatic energy stored in the capacitor under the conditions outlined in ${chapter}.`,
          type: 'Numerical',
          options: [],
          marks: marksPerQ,
          solution: 'Using the formula $U = \\frac{1}{2} C V^2$, we get $U = 0.5 \\times 10 \\times 10^{-6} \\times 50^2 = 0.5 \\times 10^{-5} \\times 2500 = 0.0125 \\text{ Joules}$.'
        });
      }
    }
  } else if (sub.includes('chem')) {
    // Generate Chemistry questions
    for (let i = 1; i <= numQuestions; i++) {
      if (i === 1) {
        sampleQuestions.push({
          id: i,
          text: `Which of the following organic mechanisms in ${chapter} proceeds via a pentavalent transition state and results in the inversion of optical configuration (Walden Inversion)?`,
          type: 'MCQ',
          options: [
            '$S_N2$ substitution mechanism',
            '$S_N1$ substitution mechanism',
            '$E1$ elimination reaction',
            '$E2$ elimination reaction'
          ],
          marks: 5,
          solution: 'Option A: $S_N2$ is a single-step bimolecular reaction that proceeds via a transition state with simultaneous bond-making and bond-breaking, causing configuration inversion.'
        });
      } else if (i === 2) {
        sampleQuestions.push({
          id: i,
          text: `State the difference between $+I$ and $-I$ inductive effects in organic chemistry, referencing their impact on carbocation stability in ${chapter}.`,
          type: 'Short',
          options: [],
          marks: marksPerQ,
          solution: '$+I$ (electron donating) groups like alkyl chains disperse positive charge and stabilize carbocations. $-I$ (electron withdrawing) groups like halogens pull electron density away, destabilizing carbocations.'
        });
      } else {
        sampleQuestions.push({
          id: i,
          text: `Calculate the pH of a $0.01\\text{ M}$ solution of hydrochloric acid ($HCl$) assuming complete dissociation as described in ${chapter}.`,
          type: 'Numerical',
          options: [],
          marks: marksPerQ,
          solution: '$HCl$ is a strong acid, so $[H^+] = 0.01\\text{ M} = 10^{-2}\\text{ M}$. Using pH $= -\\log_{10}[H^+] = -\\log_{10}(10^{-2}) = 2$.'
        });
      }
    }
  } else if (sub.includes('math')) {
    // Generate Math questions
    for (let i = 1; i <= numQuestions; i++) {
      if (i === 1) {
        sampleQuestions.push({
          id: i,
          text: `Given the double-angle trigonometric identity in ${chapter}, which of the following is equivalent to $\\cos(2\\theta)$?`,
          type: 'MCQ',
          options: [
            '$\\cos^2\\theta - \\sin^2\\theta$',
            '$2\\sin\\theta\\cos\\theta$',
            '$\\sin^2\\theta - \\cos^2\\theta$',
            '$1 + \\cos^2\\theta$'
          ],
          marks: 5,
          solution: 'Option A: According to trigonometric identities, $\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta$.'
        });
      } else if (i === 2) {
        sampleQuestions.push({
          id: i,
          text: `State and prove the derivative of $\\sin(x)$ from first principles as outlined in ${chapter}.`,
          type: 'Short',
          options: [],
          marks: marksPerQ,
          solution: 'Using limit definition: $f\'(x) = \\lim_{h \\to 0} \\frac{\\sin(x+h) - \\sin(x)}{h}$. Applying trigonometric sum-to-product formula gives the derivative as $\\cos(x)$.'
        });
      } else {
        sampleQuestions.push({
          id: i,
          text: `Evaluate the definite integral $\\int_{0}^{2} 3x^2 \\, dx$ as described in the calculus modules of ${chapter}.`,
          type: 'Numerical',
          options: [],
          marks: marksPerQ,
          solution: 'Integrate: $\\int 3x^2 \\, dx = x^3$. Evaluate from $0$ to $2$: $2^3 - 0^3 = 8$.'
        });
      }
    }
  } else {
    // Generate Biology questions
    for (let i = 1; i <= numQuestions; i++) {
      if (i === 1) {
        sampleQuestions.push({
          id: i,
          text: `Which organelle in plant cells is responsible for harvesting light energy to perform the photolysis of water in ${chapter}?`,
          type: 'MCQ',
          options: [
            'Chloroplast',
            'Mitochondria',
            'Ribosome',
            'Lysosome'
          ],
          marks: 5,
          solution: 'Option A: Chloroplasts contain thylakoid membranes (grana) where chlorophyll pigments absorb light to trigger photolysis.'
        });
      } else if (i === 2) {
        sampleQuestions.push({
          id: i,
          text: `Explain the key events that take place during the Metaphase stage of mitotic cell division in ${chapter}.`,
          type: 'Short',
          options: [],
          marks: marksPerQ,
          solution: 'During metaphase, chromosomes align along the equatorial metaphase plate of the cell, and spindle fibers attach to the kinetochores of sister chromatids.'
        });
      } else {
        sampleQuestions.push({
          id: i,
          text: `State the balanced chemical summary equation representing the biological oxidation of glucose during cellular respiration in ${chapter}.`,
          type: 'Short',
          options: [],
          marks: marksPerQ,
          solution: '$C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 36\\text{ to }38\\text{ ATP}$.'
        });
      }
    }
  }

  return sampleQuestions;
};

/**
 * AI Performance Analyzer.
 */
exports.analyzePerformance = async (studentId) => {
  try {
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Get attendance stats
    const totalAttendance = await Attendance.countDocuments({ student: studentObjectId });
    const presentAttendance = await Attendance.countDocuments({ student: studentObjectId, status: { $in: ['Present', 'Late'] } });
    const attendancePct = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 85;

    // Get test results
    const results = await Result.find({ student: studentObjectId }).populate('test');

    // Categorize subject performance
    const subjectMarks = {};
    results.forEach(res => {
      const subject = res.test.subject;
      if (!subjectMarks[subject]) subjectMarks[subject] = [];
      subjectMarks[subject].push(res.percentage);
    });

    const subjectAverages = {};
    let strongSubjects = [];
    let weakSubjects = [];

    Object.keys(subjectMarks).forEach(sub => {
      const avg = subjectMarks[sub].reduce((a, b) => a + b, 0) / subjectMarks[sub].length;
      subjectAverages[sub] = Number(avg.toFixed(2));
      if (avg >= 75) strongSubjects.push(sub);
      else weakSubjects.push(sub);
    });

    // Handle fallbacks if database is empty
    if (Object.keys(subjectAverages).length === 0) {
      subjectAverages['Physics'] = 78;
      subjectAverages['Chemistry'] = 62;
      subjectAverages['Mathematics'] = 84;
      strongSubjects = ['Physics', 'Mathematics'];
      weakSubjects = ['Chemistry'];
    }

    // Dynamic AI Recommendations
    const weakList = weakSubjects.join(', ') || 'Organic Chemistry';
    const strongList = strongSubjects.join(', ') || 'Physics & Mathematics';

    const strengthAnalysis = `Strong understanding of fundamental derivations and concepts in ${strongList}. High analytical scores in problem-solving tests.`;
    const weaknessAnalysis = `Needs improvement in memorizing reactives/formulas in ${weakList}. Conceptual foundation requires review.`;
    const improvementAreas = `Focus on practicing numerical worksheets. Dedicated study hours for ${weakList} revision.`;
    
    const personalizedStudyPlan = `- **Monday & Wednesday:** Revise core chapters of ${weakList} for 1.5 hours.
- **Tuesday & Thursday:** Complete 15 objective-type questions in ${strongList}.
- **Friday:** Mock revision test and formula sheet creation.
- **Weekend:** Review teacher remarks and attend doubt-solving tutorials.`;

    const monthlyReportRemarks = `Student demonstrates high motivation. Academic performance is strong in ${strongList} but requires active dedication to master chemical bonding, reaction mechanisms, or specific concepts in ${weakList} to boost average marks above 80%.`;

    return {
      attendancePct: Number(attendancePct.toFixed(2)),
      subjectAverages,
      strongSubjects,
      weakSubjects,
      strengthAnalysis,
      weaknessAnalysis,
      improvementAreas,
      personalizedStudyPlan,
      monthlyReportRemarks
    };
  } catch (error) {
    console.error('Error analyzing performance:', error);
    // Generic high-fidelity fallback stats
    return {
      attendancePct: 92,
      subjectAverages: { Physics: 82, Chemistry: 68, Mathematics: 88, Biology: 72 },
      strongSubjects: ['Physics', 'Mathematics'],
      weakSubjects: ['Chemistry'],
      strengthAnalysis: 'Excellent visual representation and conceptual retention in analytical subjects.',
      weaknessAnalysis: 'Struggles with organic reaction mechanisms and chemical structures.',
      improvementAreas: 'Practice drawing molecular formulas and review basic nucleophilic substitution.',
      personalizedStudyPlan: 'Focus 2 hours daily on reaction sheets and attend Saturday remedial classes.',
      monthlyReportRemarks: 'Performing very well overall. Consistent homework submission and solid attendance. Keep focusing on weaker chemistry chapters.'
    };
  }
};

/**
 * AI Career Counseling Report generator.
 */
exports.generateCareerCounsel = async (favoriteSubjects, performance, interests, goals) => {
  const prompt = `You are an AI Career Counselor at "Hi-Fi Classes". Analyze this student profile:
- Favorite Subjects: ${favoriteSubjects}
- Academic Performance: ${performance}
- General Interests: ${interests}
- Career Goals: ${goals}

Generate a personalized educational roadmap. Include:
1. Recommended Career Streams (custom to their inputs)
2. College Recommendations (India & Global)
3. Entrance Exams (JEE, NEET, etc.) and Prerequisites
4. Required Skills they should build.
Always respond in structured Markdown with headings, bold text, and bullet points.`;

  // 1. Try Google Gemini API
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error('Gemini Career Counselor error:', error);
    }
  }

  // 2. Try OpenAI API
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI Career Counselor. Generate highly personalized educational roadmaps.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('OpenAI Career Counselor error:', error);
    }
  }

  // 3. Fallback Dynamic simulated career counselor
  const favSub = favoriteSubjects || 'Physics and Math';
  const perf = performance || 'Excellent';
  const interest = interests || 'Coding and hardware';
  const goal = goals || 'Build software platforms';

  const combined = `${favSub} ${interest} ${goal}`.toLowerCase();

  if (combined.includes('biol') || combined.includes('chem') || combined.includes('med') || combined.includes('doctor') || combined.includes('health') || combined.includes('pharma') || combined.includes('clinic')) {
    // Medical/Biotech
    return `### **AI Career Consultation Report**
Based on your favorite subjects (**${favSub}**), interests (**${interest}**), and academic goals (**${goal}**), here is your tailored career roadmap.

#### **Recommended Career Streams:**
1. **Medical Sciences (MBBS/BDS/BAMS):** The traditional path. Excellence in Biology and Chemistry is key to clearing high-volume entrances.
2. **Biotechnology & Bioinformatics:** Merging biological science with computing. Highly suitable for research and pharma development.
3. **Genomics & Clinical Research:** Highly sought-after fields analyzing DNA markers and disease therapy.

#### **College Recommendations (India & Global):**
* AIIMS (New Delhi)
* IISc (Bangalore)
* IIT Kharagpur (M.Tech in Medical Science and Technology)
* Christian Medical College (Vellore)

#### **Entrance Exams & Prerequisites:**
* **NEET-UG:** Primary entrance exam for medical colleges in India. Core subjects: Biology, Physics, Chemistry.
* **IAT (IISER Aptitude Test):** For BS-MS dual degree research options.

#### **Required Skills to Build:**
- Strong grasp of Molecular Biology & Organic chemistry.
- Basic Python coding for Bioinformatics sequences.
- Scientific writing and research laboratory protocols.`;
  } else if (combined.includes('commerce') || combined.includes('business') || combined.includes('finance') || combined.includes('account') || combined.includes('econom') || combined.includes('manage') || combined.includes('market')) {
    // Commerce / Finance / Management
    return `### **AI Career Consultation Report**
Based on your favorite subjects (**${favSub}**), interests (**${interest}**), and academic goals (**${goal}**), here is your tailored career roadmap.

#### **Recommended Career Streams:**
1. **Finance & Investment Banking:** Analyzing markets, portfolios, and corporate finance. Highly lucrative and analytical.
2. **Chartered Accountancy (CA):** Elite auditing, taxation, and financial reporting pathway.
3. **Business Administration & Management (BBA/MBA):** Preparing for corporate leadership, product management, or entrepreneurship.

#### **College Recommendations (India):**
* SRCC - Shri Ram College of Commerce (Delhi)
* St. Xavier's College (Mumbai)
* NMIMS - Anil Surendra Modi School of Commerce (Mumbai)
* IIM Indore / IIM Rohtak (IPM 5-year integrated program)

#### **Entrance Exams & Suggestions:**
* **IPMAT:** Entrance exam for IIM Integrated Program in Management.
* **CA Foundation:** The entry-level test for Chartered Accountancy.
* **CUET:** For admission into top central universities (like Delhi University).

#### **Required Skills to Build:**
- Mastery of Excel spreadsheets and financial calculations.
- Strong written and verbal business communication.
- Analytical reasoning and understanding of macro/microeconomics.`;
  } else if (combined.includes('art') || combined.includes('design') || combined.includes('write') || combined.includes('creativ') || combined.includes('humanities') || combined.includes('social') || combined.includes('law') || combined.includes('legal')) {
    // Arts / Creative / Law
    return `### **AI Career Consultation Report**
Based on your favorite subjects (**${favSub}**), interests (**${interest}**), and academic goals (**${goal}**), here is your tailored career roadmap.

#### **Recommended Career Streams:**
1. **Integrated Law (BA LLB / BBA LLB):** A 5-year professional program preparing you for corporate law, litigation, or judicial services.
2. **Communication Design & UI/UX:** Crafting digital interfaces and brand designs. Merges creativity with technology.
3. **Journalism, Media & Creative Writing:** Content strategy, public relations, and investigative writing in modern digital media.

#### **College Recommendations (India):**
* NLSIU - National Law School of India University (Bangalore)
* NALSAR University of Law (Hyderabad)
* NID - National Institute of Design (Ahmedabad)
* NIFT - National Institute of Fashion Technology
* Symbiosis Law School (Pune) / Ashoka University (Liberal Arts)

#### **Entrance Exams & Suggestions:**
* **CLAT / AILET:** Core entrance exams for National Law Universities (NLUs).
* **UCEED / NID DAT:** Standardized entrance tests for design institutes.
* **CUET:** For liberal arts courses in central universities.

#### **Required Skills to Build:**
- Critical thinking, analytical reasoning, and debate.
- Visual storytelling, sketching, and design tools (Figma, Adobe Creative Suite).
- Outstanding reading comprehension and essay writing.`;
  } else {
    // Default to Engineering/CS/Technology
    return `### **AI Career Consultation Report**
Based on your favorite subjects (**${favSub}**), interests (**${interest}**), and academic goals (**${goal}**), here is your tailored career roadmap.

#### **Recommended Career Streams:**
1. **Computer Science & AI Engineering:** Developing modern software systems, learning machine learning, and full-stack platforms.
2. **Data Science / Quantitative Analysis:** Applying statistical principles, vectors, and matrices to solve complex analytical problems.
3. **Aerospace & Mechanical Engineering:** Designing physical machines, vehicles, and thermal systems using principles of mechanics.

#### **College Recommendations (India):**
* IIT Bombay / IIT Madras / IIT Delhi
* BITS Pilani
* NIT Trichy
* COEP (Pune) / VJTI (Mumbai)

#### **Entrance Exams & Suggestions:**
* **JEE Main & JEE Advanced:** The premier engineering entrance examinations in India.
* **MHT-CET / regional tests:** Highly scoring path to local government-aided engineering colleges.

#### **Required Skills to Build:**
- Algorithmic problem-solving logic (Algorithms and Data Structures).
- Mastery of Calculus, Linear Algebra (Matrices), and Vectors.
- Hands-on coding projects in languages like Python, C++, or JavaScript.`;
  }
};
