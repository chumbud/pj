// OSRS Widget - Shows closest skill to 99 on homepage

// Map skill names to OSRS Wiki icon filenames
function getSkillIconUrl(skillName) {
    const skillIconMap = {
        'Attack': 'Attack_icon.png',
        'Strength': 'Strength_icon.png',
        'Defence': 'Defence_icon.png',
        'Ranged': 'Ranged_icon.png',
        'Prayer': 'Prayer_icon.png',
        'Magic': 'Magic_icon.png',
        'Runecraft': 'Runecraft_icon.png',
        'Construction': 'Construction_icon.png',
        'Hitpoints': 'Hitpoints_icon.png',
        'Agility': 'Agility_icon.png',
        'Herblore': 'Herblore_icon.png',
        'Thieving': 'Thieving_icon.png',
        'Crafting': 'Crafting_icon.png',
        'Fletching': 'Fletching_icon.png',
        'Slayer': 'Slayer_icon.png',
        'Hunter': 'Hunter_icon.png',
        'Mining': 'Mining_icon.png',
        'Smithing': 'Smithing_icon.png',
        'Fishing': 'Fishing_icon.png',
        'Cooking': 'Cooking_icon.png',
        'Firemaking': 'Firemaking_icon.png',
        'Woodcutting': 'Woodcutting_icon.png',
        'Farming': 'Farming_icon.png'
    };
    
    const iconFilename = skillIconMap[skillName] || 'Attack_icon.png';
    return `https://oldschool.runescape.wiki/images/${iconFilename}`;
}

// Render OSRS Widget
function renderOSRSWidget(data) {
    const widgetContainer = document.getElementById('osrs-widget-skill');
    if (!widgetContainer) return; // Not on homepage

    if (!data || data.error || !data.closestTo99) {
        widgetContainer.innerHTML = '<div class="osrs-widget-error">No active skills</div>';
        return;
    }

    const skill = data.closestTo99;
    const percentage = Math.round(skill.progress * 100);
    const iconUrl = getSkillIconUrl(skill.name);
    
    widgetContainer.innerHTML = `
        <div class="skill-content">
            <div class="skill-header">
                <span class="skill-name">
                    <img src="${iconUrl}" alt="${skill.name}" class="skill-icon" onerror="this.style.display='none'">
                    ${skill.name}
                </span>
                <span class="skill-level">Level ${skill.level}</span>
            </div>
            <div class="osrs-widget-progress">
                <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="skill-percentage">${percentage}% til 99</div>
        </div>
    `;
}

// Fetch OSRS Stats for widget
async function fetchOSRSWidget() {
    const widgetContainer = document.getElementById('osrs-widget-skill');
    if (!widgetContainer) return;

    try {
        const response = await fetch('/api/osrs/stats');
        
        // Check if response is ok
        if (!response.ok && response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle error responses gracefully
        if (data.error && !data.closestTo99) {
            if (widgetContainer) {
                widgetContainer.innerHTML = '<div class="osrs-widget-error">Temporarily unavailable</div>';
            }
            return;
        }
        
        // Show live indicator after successful load
        const liveIndicator = document.querySelector('.live-indicator');
        if (liveIndicator) {
            liveIndicator.classList.add('visible');
        }
        
        renderOSRSWidget(data);
    } catch (error) {
        // Only log non-network errors to avoid console spam
        if (!error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION')) {
            console.error('Error fetching OSRS widget:', error);
        }
        if (widgetContainer) {
            widgetContainer.innerHTML = '<div class="osrs-widget-error">Temporarily unavailable</div>';
        }
        // Don't show live indicator on error
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('osrs-widget');
    if (widget) {
        fetchOSRSWidget();
        
        // Refresh every 10 minutes
        setInterval(() => {
            fetchOSRSWidget();
        }, 10 * 60 * 1000);
    }
});
