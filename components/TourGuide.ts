import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const driverConfig = {
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    stagePadding: 5,
    popoverClass: 'driverjs-theme',
};

export const startDashboardTour = (onFinish?: () => void) => {
    const driverObj = driver({
        ...driverConfig,
        steps: [
            { element: '#tour-welcome', popover: { title: 'Welcome to Excellent Academy', description: 'Let take a quick tour of your new interactive digital textbook.', side: "left", align: 'start' } },
            { element: '#tour-grade-selector', popover: { title: 'Grade Selector', description: 'Toggle between Class 11 and Class 12 content here. Each grade has its own set of topics and simulations.', side: "bottom", align: 'start' } },
            { element: '#tour-subject-tabs', popover: { title: 'Subject Filter', description: 'Filter the curriculum by Physics, Chemistry, or Biology to find exactly what you need.', side: "bottom", align: 'start' } },
            {
                element: '#tour-topic-grid',
                popover: {
                    title: 'Topic Explorer',
                    description: 'Browse the available topics here. Click "Next" to see a live demo of a topic!',
                    side: "top",
                    align: 'start',
                    doneBtnText: 'Next'
                }
            }
        ],
        onDestroyStarted: (element, step, { state }) => {
            driverObj.destroy();
            if (activeTourStepIsLast(step) && onFinish) {
                onFinish();
            }
        }
    });

    // Helper to check if it's the last step (index 3)
    const activeTourStepIsLast = (step: any) => {
        return step?.element === '#tour-topic-grid';
    };

    driverObj.drive();
};

export const startTopicTour = () => {
    const driverObj = driver({
        ...driverConfig,
        steps: [
            { element: '#tour-simulation', popover: { title: '1. Interactive Simulation', description: 'Experience the concept in 3D! Interact with the controls to see real-time changes.', side: "right", align: 'start' } },
            { element: '#tour-content', popover: { title: '2. Comprehensive Notes', description: 'Read detailed explanations, derivations, and key concepts tailored to the NCERT curriculum.', side: "left", align: 'start' } },
            { element: '#tour-real-world', popover: { title: '3. Real-World Analogies', description: 'Understand abstract concepts through simple, relatable real-life examples.', side: "top", align: 'start' } },
            { element: '#tour-videos', popover: { title: '4. Video Resources', description: 'Watch curated videos to reinforce your understanding visually.', side: "top", align: 'start' } }
        ]
    });

    driverObj.drive();
};
