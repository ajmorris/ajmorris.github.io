import { getEmDashEntry, type PortableTextBlock } from "emdash";

export interface SiteCopy {
	accentWord: string;
	heroHeadline: string;
	heroIntro: string;
	emailPlaceholder: string;
	submitLabel: string;
	heroTagline: string;
	bandIntro: string;
	bandTagline: string;
	popupTitle: string;
	popupBody: string;
	popupButton: string;
	thanksMessage: string;
	footerLine: string;
	bookLabel: string;
	bookUrl: string;
	archiveTitle: string;
	archiveIntro: string;
	startHeading: string;
	mostReadHeading: string;
	inlineTitle: string;
	inlineBody: string;
	inlineButton: string;
	newsletterByline: string;
	bookBoxTitle: string;
	bookBoxLink: string;
	calloutLabel: string;
	privacyLabel: string;
	homeIntro: PortableTextBlock[];
}

const LOREM =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

export const fallbackCopy: SiteCopy = {
	accentWord: "Lorem",
	heroHeadline: "Ipsum dolor sit amet",
	heroIntro: LOREM,
	emailPlaceholder: "Lorem ipsum email",
	submitLabel: "Lorem ipsum",
	heroTagline: "Lorem ipsum. Dolor sit. Amet elit.",
	bandIntro: LOREM,
	bandTagline: "Lorem ipsum. Dolor sit. Amet elit.",
	popupTitle: "Lorem ipsum dolor sit amet.",
	popupBody: "Consectetur adipiscing elit. Sed do eiusmod tempor.",
	popupButton: "Lorem ipsum dolor",
	thanksMessage: "Lorem ipsum dolor sit amet. Consectetur adipiscing elit.",
	footerLine: "© 2026 Lorem ipsum",
	bookLabel: "Lorem ipsum",
	bookUrl: "https://example.com",
	archiveTitle: "Lorem",
	archiveIntro: LOREM,
	startHeading: "Lorem ipsum dolor sit amet:",
	mostReadHeading: "Lorem ipsum:",
	inlineTitle: "Lorem ipsum dolor sit amet?",
	inlineBody: LOREM,
	inlineButton: "Lorem ipsum",
	newsletterByline: "Lorem ipsum dolor",
	bookBoxTitle: "Lorem ipsum dolor sit amet.",
	bookBoxLink: "Lorem ipsum dolor",
	calloutLabel: "Lorem ipsum:",
	privacyLabel: "Privacy policy",
	homeIntro: [],
};

export async function loadSiteCopy() {
	const { entry, cacheHint, error } = await getEmDashEntry("site_copy", "site");
	if (error || !entry) {
		return { copy: fallbackCopy, cacheHint };
	}

	const data = entry.data;
	const copy: SiteCopy = {
		accentWord: data.accent_word || fallbackCopy.accentWord,
		heroHeadline: data.hero_headline || fallbackCopy.heroHeadline,
		heroIntro: data.hero_intro || fallbackCopy.heroIntro,
		emailPlaceholder: data.email_placeholder || fallbackCopy.emailPlaceholder,
		submitLabel: data.submit_label || fallbackCopy.submitLabel,
		heroTagline: data.hero_tagline || fallbackCopy.heroTagline,
		bandIntro: data.band_intro || fallbackCopy.bandIntro,
		bandTagline: data.band_tagline || fallbackCopy.bandTagline,
		popupTitle: data.popup_title || fallbackCopy.popupTitle,
		popupBody: data.popup_body || fallbackCopy.popupBody,
		popupButton: data.popup_button || fallbackCopy.popupButton,
		thanksMessage: data.thanks_message || fallbackCopy.thanksMessage,
		footerLine: data.footer_line || fallbackCopy.footerLine,
		bookLabel: data.book_label || fallbackCopy.bookLabel,
		bookUrl: data.book_url || fallbackCopy.bookUrl,
		archiveTitle: data.archive_title || fallbackCopy.archiveTitle,
		archiveIntro: data.archive_intro || fallbackCopy.archiveIntro,
		startHeading: data.start_heading || fallbackCopy.startHeading,
		mostReadHeading: data.most_read_heading || fallbackCopy.mostReadHeading,
		inlineTitle: data.inline_title || fallbackCopy.inlineTitle,
		inlineBody: data.inline_body || fallbackCopy.inlineBody,
		inlineButton: data.inline_button || fallbackCopy.inlineButton,
		newsletterByline: data.newsletter_byline || fallbackCopy.newsletterByline,
		bookBoxTitle: data.book_box_title || fallbackCopy.bookBoxTitle,
		bookBoxLink: data.book_box_link || fallbackCopy.bookBoxLink,
		calloutLabel: data.callout_label || fallbackCopy.calloutLabel,
		privacyLabel: data.privacy_label || fallbackCopy.privacyLabel,
		homeIntro: data.home_intro ?? fallbackCopy.homeIntro,
	};

	return { copy, cacheHint, entry };
}

export function asDate(value: unknown): Date | null {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
	if (typeof value === "string" || typeof value === "number") {
		const date = new Date(value);
		if (!Number.isNaN(date.getTime())) return date;
	}
	return null;
}

export function formatLongDate(value: unknown) {
	const date = asDate(value);
	if (!date) return "";
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});
}

export function formatMonth(value: unknown) {
	const date = asDate(value);
	if (!date) return "";
	return date.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

export function postDate(data: { display_date?: unknown; publishedAt?: Date | null }) {
	return asDate(data.display_date) ?? data.publishedAt ?? null;
}

export function isCurrentPath(url: string, pathname: string) {
	if (!url.startsWith("/")) return false;
	const normalize = (path: string) => {
		const base = path.split("?")[0] || "/";
		return base.endsWith("/") ? base : `${base}/`;
	};
	return normalize(url) === normalize(pathname);
}
