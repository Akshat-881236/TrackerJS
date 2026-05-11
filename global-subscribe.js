/* =========================================================
   AKSHAT NETWORK HUB — GLOBAL SUBSCRIBE DIALOG SYSTEM
   Mobile Optimized • Stylish • Dynamic • Professional
   Brevo + Cloudflare Worker Connected
   ========================================================= */

(function () {

    /* =========================================
       CONFIGURATION
    ========================================= */

    const CONFIG = {

        workerURL:
            "https://anh-subscribe-api.akshatpsd2005.workers.dev/",

        popupDelay: 4000,

        showOnceEveryHours: 12,

        title:
            "Stay Updated",

        subtitle:
            "Subscribe to receive latest updates about Quizzone, Portfolio, TrackerJS and Akshat Network Hub projects.",

        buttonText:
            "Subscribe Now",

        successMessage:
            "Successfully Subscribed!",

        failMessage:
            "Subscription Failed",

        storageKey:
            "ANH_SUBSCRIBE_POPUP_LAST_SHOWN"
    };

    /* =========================================
       PREVENT MULTIPLE POPUPS
    ========================================= */

    if (window.ANH_SUBSCRIBE_POPUP_LOADED)
        return;

    window.ANH_SUBSCRIBE_POPUP_LOADED = true;

    /* =========================================
       CHECK DISPLAY TIME
    ========================================= */

    const lastShown =
        localStorage.getItem(CONFIG.storageKey);

    if (lastShown) {

        const hoursPassed =
            (Date.now() - Number(lastShown))
            / (1000 * 60 * 60);

        if (hoursPassed <
            CONFIG.showOnceEveryHours) {

            return;
        }
    }

    /* =========================================
       LOAD POPUP
    ========================================= */

    setTimeout(createPopup,
        CONFIG.popupDelay);

    /* =========================================
       CREATE POPUP
    ========================================= */

    function createPopup() {

        /* Overlay */

        const overlay =
            document.createElement("div");

        overlay.id = "anhSubscribeOverlay";

        /* Popup */

        const popup =
            document.createElement("div");

        popup.id = "anhSubscribePopup";

        popup.innerHTML = `

            <button id="anhClosePopup">
                ✕
            </button>

            <div class="anhLogo">
                ✦
            </div>

            <h2>
                ${CONFIG.title}
            </h2>

            <p>
                ${CONFIG.subtitle}
            </p>

            <form id="anhSubscribeForm">

                <input
                    type="email"
                    id="anhSubscribeEmail"
                    placeholder="Enter your email"
                    required
                >

                <button type="submit">
                    ${CONFIG.buttonText}
                </button>

            </form>

            <div id="anhSubscribeStatus"></div>
        `;

        overlay.appendChild(popup);

        document.body.appendChild(overlay);

        /* Save show time */

        localStorage.setItem(
            CONFIG.storageKey,
            Date.now()
        );

        /* Add Styles */

        injectStyles();

        /* Close Button */

        document
            .getElementById("anhClosePopup")
            .addEventListener("click",
                closePopup);

        /* Overlay Click Close */

        overlay.addEventListener("click",
            function (e) {

                if (e.target === overlay)
                    closePopup();
            });

        /* Form Submit */

        document
            .getElementById("anhSubscribeForm")
            .addEventListener("submit",
                handleSubscribe);
    }

    /* =========================================
       HANDLE SUBSCRIPTION
    ========================================= */

    async function handleSubscribe(e) {

        e.preventDefault();

        const email =
            document.getElementById(
                "anhSubscribeEmail"
            ).value;

        const status =
            document.getElementById(
                "anhSubscribeStatus"
            );

        status.innerHTML =
            `<span class="loading">
                Subscribing...
            </span>`;

        try {

            const response =
                await fetch(
                    CONFIG.workerURL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email
                        })
                    }
                );

            const data =
                await response.json();

            if (data.success) {

                status.innerHTML =
                    `<span class="success">
                        ${CONFIG.successMessage}
                    </span>`;

                setTimeout(closePopup,
                    2000);

            } else {

                status.innerHTML =
                    `<span class="error">
                        ${data.message ||
                        CONFIG.failMessage}
                    </span>`;
            }

        } catch (err) {

            status.innerHTML =
                `<span class="error">
                    ${CONFIG.failMessage}
                </span>`;
        }
    }

    /* =========================================
       CLOSE POPUP
    ========================================= */

    function closePopup() {

        const overlay =
            document.getElementById(
                "anhSubscribeOverlay"
            );

        if (overlay) {

            overlay.style.opacity = "0";

            setTimeout(() => {

                overlay.remove();

            }, 300);
        }
    }

    /* =========================================
       INJECT STYLES
    ========================================= */

    function injectStyles() {

        if (document.getElementById(
            "anhSubscribeStyles"))
            return;

        const style =
            document.createElement("style");

        style.id =
            "anhSubscribeStyles";

        style.innerHTML = `

        #anhSubscribeOverlay{

            position:fixed;
            inset:0;

            background:
                rgba(0,0,0,0.65);

            display:flex;

            align-items:center;
            justify-content:center;

            z-index:999999;

            padding:20px;

            animation:
                anhFadeIn 0.3s ease;
        }

        #anhSubscribePopup{

            width:100%;
            max-width:420px;

            background:
                linear-gradient(
                    135deg,
                    #0f172a,
                    #111827
                );

            color:white;

            border-radius:24px;

            padding:32px 24px;

            position:relative;

            box-shadow:
                0 15px 60px
                rgba(0,0,0,0.4);

            text-align:center;

            animation:
                anhPopupIn 0.35s ease;
        }

        #anhClosePopup{

            position:absolute;

            top:15px;
            right:15px;

            background:none;

            border:none;

            color:white;

            font-size:20px;

            cursor:pointer;

            opacity:0.7;
        }

        #anhClosePopup:hover{

            opacity:1;
        }

        .anhLogo{

            width:72px;
            height:72px;

            margin:auto;

            border-radius:50%;

            display:flex;

            align-items:center;
            justify-content:center;

            font-size:32px;

            background:
                linear-gradient(
                    135deg,
                    #00c16a,
                    #00e08f
                );

            margin-bottom:20px;
        }

        #anhSubscribePopup h2{

            margin:0;

            font-size:28px;

            font-weight:700;
        }

        #anhSubscribePopup p{

            margin-top:14px;

            line-height:1.6;

            opacity:0.85;

            font-size:15px;
        }

        #anhSubscribeForm{

            margin-top:25px;
        }

        #anhSubscribeEmail{

            width:100%;

            padding:15px;

            border:none;

            border-radius:14px;

            font-size:15px;

            outline:none;

            box-sizing:border-box;
        }

        #anhSubscribeForm button{

            width:100%;

            margin-top:15px;

            padding:15px;

            border:none;

            border-radius:14px;

            background:
                linear-gradient(
                    135deg,
                    #00c16a,
                    #00e08f
                );

            color:white;

            font-size:16px;

            font-weight:600;

            cursor:pointer;

            transition:0.3s;
        }

        #anhSubscribeForm button:hover{

            transform:translateY(-2px);

            opacity:0.95;
        }

        #anhSubscribeStatus{

            margin-top:16px;

            font-size:14px;
        }

        .success{

            color:#00ff9d;
        }

        .error{

            color:#ff6b6b;
        }

        .loading{

            color:#ffd166;
        }

        @keyframes anhFadeIn{

            from{
                opacity:0;
            }

            to{
                opacity:1;
            }
        }

        @keyframes anhPopupIn{

            from{

                opacity:0;

                transform:
                    translateY(20px)
                    scale(0.95);
            }

            to{

                opacity:1;

                transform:
                    translateY(0)
                    scale(1);
            }
        }

        @media(max-width:480px){

            #anhSubscribePopup{

                padding:26px 20px;
            }

            #anhSubscribePopup h2{

                font-size:24px;
            }

            #anhSubscribePopup p{

                font-size:14px;
            }
        }
        `;

        document.head.appendChild(style);
    }

})();