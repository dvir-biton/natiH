const firstPopup = document.getElementById('first-popup');
const secondPopup = document.getElementById('second-popup');
const popupOverlay = document.getElementById('popup-overlay');

function showPopups() {
    firstPopup.style.display = 'flex';
    popupOverlay.style.display = 'block';
}

function hidePopups() {
    firstPopup.style.display = 'none';
    secondPopup.style.display = 'none';
    popupOverlay.style.display = 'none';
}

// First popup
const taxRefundForm = document.getElementById('tax-refund-form');
const taxRefundFormData = {};
taxRefundForm.addEventListener('submit', function (e) {
    e.preventDefault();
    for (let element of this.elements) {
        if (element.name) {
            taxRefundFormData[element.name] = element.value;
        }
    }
    firstPopup.style.display = 'none';
    secondPopup.style.display = 'block';
});

// Second popup 
const popupContactForm = document.getElementById('popup-contact-form');
popupContactForm.addEventListener('submit', function (e) {
    for (let element of this.elements) {
        if (element.name) {
            taxRefundFormData[element.name] = element.value;
        }
    }
    e.preventDefault();
    sendForm(taxRefundFormData).then(ok => {
        if (ok) {
            taxRefundForm.reset();
            this.reset();
        }
    });
});

// Footer form
document.getElementById('footer-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = {};
    for (let element of this.elements) {
        if (element.name) {
            formData[element.name] = element.value;
        }
    }
    sendForm(formData).then(ok => {
        if (ok) {
            this.reset();
        }
    });
});

function sendForm(data) {
    return fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => {
            if (res.ok) {
                secondPopup.style.display = 'none';
                popupOverlay.style.display = 'none';
                alert('נשלח בהצלחה!');
                return true;
            }
            throw new Error();
        })
        .catch(err => {
            alert("שגיאה בעת שליחת ההודעה, אנא נסה שוב מאוחר יותר.")
            return false;
        });
}

function formatPhoneNumber(input) {
    let phone = input.value.replace(/\D/g, '');
    if (phone.length > 10) phone = phone.substring(0, 10);

    // Format input as XXX-XXX-XXXX
    if (phone.length > 6) {
        input.value = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (phone.length > 3) {
        input.value = phone.replace(/(\d{3})(\d{1,3})/, '$1-$2');
    } else {
        input.value = phone;
    }
}

const ANIMATION_TIME_MS = 400;
class ScrollingAnimation {
    constructor(el) {
        this.el = el;
        this.summary = el.querySelector('summary');
        this.content = el.querySelector('.answer');

        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.summary.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e) {
        e.preventDefault();
        this.el.style.overflow = 'hidden';
        if (this.isClosing || !this.el.open) {
            this.open();
        } else if (this.isExpanding || this.el.open) {
            this.shrink();
        }
    }

    shrink() {
        this.isClosing = true;

        const startHeight = this.el.offsetHeight + 'px';
        const endHeight = this.summary.offsetHeight + 'px';

        if (this.animation) {
            this.animation.cancel();
        }

        this.animation = this.el.animate({
            height: [startHeight, endHeight]
        }, {
            duration: ANIMATION_TIME_MS,
            easing: 'ease-out'
        });

        this.animation.onfinish = () => this.onAnimationFinish(false);
        this.animation.oncancel = () => this.isClosing = false;
    }

    open() {
        this.el.style.height = this.el.offsetHeight + 'px';
        this.el.open = true;
        window.requestAnimationFrame(() => this.expand());
    }

    expand() {
        this.isExpanding = true;
        const startHeight = this.el.offsetHeight + 'px';
        const endHeight = (this.summary.offsetHeight + this.content.offsetHeight) + 'px';

        if (this.animation) {
            this.animation.cancel();
        }

        this.animation = this.el.animate({
            height: [startHeight, endHeight],
        }, {
            duration: ANIMATION_TIME_MS,
            easing: 'ease-out',
        });
        this.animation.onfinish = () => this.onAnimationFinish(true);
        this.animation.oncancel = () => this.isExpanding = false;
    }

    onAnimationFinish(open) {
        this.el.open = open;
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.el.style.height = this.el.style.overflow = '';
    }
}

document.querySelectorAll('details').forEach((el) => {
    new ScrollingAnimation(el);
});