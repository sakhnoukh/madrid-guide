module.exports = [
"[project]/data/places.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// data/places.ts
__turbopack_context__.s([
    "PLACES",
    ()=>PLACES
]);
const PLACES = [
    {
        id: "hanso",
        name: "HanSo Café",
        neighborhood: "Malasaña",
        category: "coffee",
        tags: [
            "laptop-friendly",
            "solo"
        ],
        rating: 4.5,
        shortBlurb: "Good flat white, busy on weekends. Nice for a solo work session.",
        longReview: "One of those spots where you can sit by the window with a laptop or a book and lose track of time. It does get loud on weekend afternoons, so I like it more on weekday mornings. Coffee is consistently good; pastries are fine but not the main reason to come.",
        priceLevel: 2,
        goodFor: [
            "solo-coffee",
            "laptop-work",
            "quick-stop"
        ],
        googleMapsUrl: "https://maps.google.com/..."
    },
    {
        id: "acid",
        name: "Acid Café",
        neighborhood: "Centro",
        category: "coffee",
        tags: [
            "quiet",
            "solo"
        ],
        rating: 4.2,
        shortBlurb: "Calm vibe, solid pour-over. Great spot after a walk.",
        longReview: "Feels like a small escape right in the center. It's usually calmer than most cafés nearby, which makes it good for reading or just decompressing after walking around. Coffee leans more towards specialty vibes. Not a place for big groups.",
        priceLevel: 2,
        goodFor: [
            "solo-coffee",
            "quick-stop",
            "long-conversations"
        ],
        googleMapsUrl: "https://maps.google.com/..."
    },
    {
        id: "sala-equis",
        name: "Sala Equis",
        neighborhood: "Centro",
        category: "bar",
        tags: [
            "groups",
            "first-date"
        ],
        rating: 4.0,
        shortBlurb: "Fun space, good for a casual drink and people-watching.",
        longReview: "Big, lively space that feels more like a hangout than a classic bar. It's easy to spend a few hours here without noticing. Great for a first date if you want something informal and not too quiet. Not where you go for serious cocktails, more for the overall vibe.",
        priceLevel: 2,
        goodFor: [
            "groups",
            "first-date",
            "long-conversations"
        ],
        googleMapsUrl: "https://maps.google.com/..."
    },
    {
        id: "terraza-xx",
        name: "Random Terraza",
        neighborhood: "La Latina",
        category: "bar",
        tags: [
            "groups",
            "cheap"
        ],
        rating: 3.6,
        shortBlurb: "Nice for a big group, drinks are fine but it's more about the vibe.",
        longReview: "One of those terraces you end up in with friends because there's space. It's not mind-blowing, but it works if you just want to sit outside and talk. Drinks are standard and prices are reasonable. I wouldn't cross the city for it, but it's good if you're already in the area.",
        priceLevel: 1,
        goodFor: [
            "groups",
            "quick-stop"
        ],
        googleMapsUrl: "https://maps.google.com/..."
    },
    {
        id: "bodega-yy",
        name: "Small Bodega",
        neighborhood: "Lavapiés",
        category: "restaurant",
        tags: [
            "cheap",
            "quiet"
        ],
        rating: 4.3,
        shortBlurb: "Simple, honest food. Good if you're nearby and want something cozy.",
        longReview: "Feels like eating at someone's home in the best way. The menu is small but done with care. It's not a place for a rushed meal; it's more for a slow lunch or dinner where you actually talk. Great to bring one or two people, less ideal for big groups.",
        priceLevel: 2,
        goodFor: [
            "long-conversations",
            "first-date",
            "solo-coffee"
        ],
        googleMapsUrl: "https://maps.google.com/..."
    }
];
}),
"[project]/components/PlaceCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlaceCard",
    ()=>PlaceCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
// components/PlaceCard.tsx
"use client";
;
;
function PlaceCard({ place }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "flex h-full flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                href: `/places/${place.id}`,
                className: "flex-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-1 flex items-baseline justify-between gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-serif text-lg leading-snug",
                                    children: place.name
                                }, void 0, false, {
                                    fileName: "[project]/components/PlaceCard.tsx",
                                    lineNumber: 18,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs uppercase tracking-wide text-[#9A9A9A]",
                                    children: place.neighborhood
                                }, void 0, false, {
                                    fileName: "[project]/components/PlaceCard.tsx",
                                    lineNumber: 19,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/PlaceCard.tsx",
                            lineNumber: 17,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mb-2 text-xs text-[#9A9A9A]",
                            children: [
                                place.category === "coffee" && "Coffee",
                                place.category === "restaurant" && "Restaurant",
                                place.category === "bar" && "Bar"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/PlaceCard.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-3 flex flex-wrap gap-1",
                            children: place.tags.map((tag)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "rounded-full bg-[#F0E1D7] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7A4A35]",
                                    children: tag.replace("-", " ")
                                }, tag, false, {
                                    fileName: "[project]/components/PlaceCard.tsx",
                                    lineNumber: 34,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/components/PlaceCard.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-[#4B4B4B]",
                            children: place.shortBlurb
                        }, void 0, false, {
                            fileName: "[project]/components/PlaceCard.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/PlaceCard.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/PlaceCard.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 flex items-center justify-between text-xs text-[#9A9A9A]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[13px]",
                                children: "★"
                            }, void 0, false, {
                                fileName: "[project]/components/PlaceCard.tsx",
                                lineNumber: 51,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: place.rating.toFixed(1)
                            }, void 0, false, {
                                fileName: "[project]/components/PlaceCard.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/PlaceCard.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    place.googleMapsUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: place.googleMapsUrl,
                        target: "_blank",
                        rel: "noreferrer",
                        className: "text-[11px] font-medium text-[#D46A4C] underline-offset-2 hover:underline",
                        onClick: (e)=>e.stopPropagation(),
                        children: "View on map →"
                    }, void 0, false, {
                        fileName: "[project]/components/PlaceCard.tsx",
                        lineNumber: 55,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[11px]",
                        children: "Map coming soon"
                    }, void 0, false, {
                        fileName: "[project]/components/PlaceCard.tsx",
                        lineNumber: 65,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/PlaceCard.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/PlaceCard.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/places/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PlacesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$places$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/data/places.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$PlaceCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/PlaceCard.tsx [app-ssr] (ecmascript)");
// app/places/page.tsx
"use client";
;
;
;
;
function PlacesPage() {
    const [activeCategory, setActiveCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [activeTag, setActiveTag] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const allTags = Array.from(new Set(__TURBOPACK__imported__module__$5b$project$5d2f$data$2f$places$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PLACES"].flatMap((place)=>place.tags)));
    const filteredPlaces = __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$places$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PLACES"].filter((place)=>{
        const categoryMatch = activeCategory === "all" || place.category === activeCategory;
        const tagMatch = activeTag === "all" || place.tags.includes(activeTag);
        return categoryMatch && tagMatch;
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto min-h-screen max-w-6xl px-4 py-16 sm:py-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "mb-3 font-serif text-3xl sm:text-4xl",
                        children: "Places in Madrid"
                    }, void 0, false, {
                        fileName: "[project]/app/places/page.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "max-w-xl text-sm text-[#9A9A9A]",
                        children: "Cafés, restaurants, and bars I actually go to. This list will grow as I keep exploring."
                    }, void 0, false, {
                        fileName: "[project]/app/places/page.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/places/page.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mb-8 space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-2 text-xs sm:text-sm",
                        children: [
                            {
                                label: "All",
                                value: "all"
                            },
                            {
                                label: "Coffee",
                                value: "coffee"
                            },
                            {
                                label: "Restaurants",
                                value: "restaurant"
                            },
                            {
                                label: "Bars",
                                value: "bar"
                            }
                        ].map((item)=>{
                            const isActive = activeCategory === item.value;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveCategory(item.value),
                                className: [
                                    "rounded-full border px-3 py-1 transition",
                                    isActive ? "border-[#D46A4C] bg-[#D46A4C] text-white" : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]"
                                ].join(" "),
                                children: item.label
                            }, item.value, false, {
                                fileName: "[project]/app/places/page.tsx",
                                lineNumber: 49,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/app/places/page.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-2 text-[11px] sm:text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "mr-1 text-[#9A9A9A]",
                                children: "Tags:"
                            }, void 0, false, {
                                fileName: "[project]/app/places/page.tsx",
                                lineNumber: 67,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveTag("all"),
                                className: [
                                    "rounded-full border px-3 py-1 transition",
                                    activeTag === "all" ? "border-[#1E3A5F] bg-[#1E3A5F] text-white" : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]"
                                ].join(" "),
                                children: "All"
                            }, void 0, false, {
                                fileName: "[project]/app/places/page.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            allTags.map((tag)=>{
                                const isActive = activeTag === tag;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setActiveTag(tag),
                                    className: [
                                        "rounded-full border px-3 py-1 transition capitalize",
                                        isActive ? "border-[#1E3A5F] bg-[#1E3A5F] text-white" : "border-[#D8C7B8] bg-[#FDF8F3] text-[#4B4B4B] hover:bg-[#F1E4D7]"
                                    ].join(" "),
                                    children: tag.replace("-", " ")
                                }, tag, false, {
                                    fileName: "[project]/app/places/page.tsx",
                                    lineNumber: 82,
                                    columnNumber: 15
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/places/page.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/places/page.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                children: filteredPlaces.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-[#9A9A9A]",
                    children: "No places match this filter yet."
                }, void 0, false, {
                    fileName: "[project]/app/places/page.tsx",
                    lineNumber: 102,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
                    children: filteredPlaces.map((place)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$PlaceCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaceCard"], {
                            place: place
                        }, place.id, false, {
                            fileName: "[project]/app/places/page.tsx",
                            lineNumber: 108,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/places/page.tsx",
                    lineNumber: 106,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/places/page.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/places/page.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
];

//# sourceMappingURL=_3e5053ee._.js.map