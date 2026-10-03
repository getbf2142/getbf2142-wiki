// Strings for our own components. Starlight's built-in UI strings live in src/content/i18n/.
// `locale` is Starlight's locale key: undefined for English (root), 'zh-tw' for Traditional Chinese.
const ui = {
	en: {
		'nav.main': 'Main',
		'external.newTab': '(opens in a new tab)',
		'form.contact': 'Contact us',
		'form.feedback': 'Feedback',
		'guide.fullGuide': 'Full guide',
		'summary.label': 'In short',
		'summary.step': 'Step {step} of {total}',
		'summary.time': 'About {time}',
		'summary.optional': 'Optional',
		'footer.label': 'Get help',
		'footer.prompt': 'Stuck, or have thoughts on this guide?',
		'footer.troubleshoot': 'Troubleshoot',
		'footer.discord': 'Ask on Discord',
		'footer.feedback': 'Send feedback',
		'footer.star': 'Star this project',
		'footer.disclaimer': 'GetBF2142 is not affiliated with or endorsed by EA, DICE, GameSpy or OpenSpy.',
		'footer.disclaimerLink': 'Disclaimer',
		'embed.video': 'YouTube video',
		'contact.name': 'Name',
		'contact.email': 'Email',
		'contact.content': 'Message',
		'feedback.question': 'Is this website helpful?',
		'feedback.low': '1 = Useless',
		'feedback.high': '5 = Very useful',
		'feedback.message': 'Say a few words to encourage us!',
		'form.send': 'Send',
		'form.success': 'Thanks! Your message has been sent.',
		'form.error': 'Something went wrong and your message was not sent. Please try again later.',
	},
	'zh-tw': {
		'nav.main': '主選單',
		'external.newTab': '（在新分頁開啟）',
		'form.contact': '聯絡我們',
		'form.feedback': '意見回饋',
		'guide.fullGuide': '完整指南',
		'summary.label': '懶人包',
		'summary.step': '第 {step} 步，共 {total} 步',
		'summary.time': '約 {time}',
		'summary.optional': '可跳過',
		'footer.label': '需要幫忙？',
		'footer.prompt': '卡關了，或對這篇指南有什麼想法？',
		'footer.troubleshoot': '疑難排解',
		'footer.discord': '到 Discord 問問',
		'footer.feedback': '給我們意見',
		'footer.star': '為專案加星',
		'footer.disclaimer': 'GetBF2142 與 EA、DICE、GameSpy 和 OpenSpy 沒有任何關係，也沒有得到他們的認可。',
		'footer.disclaimerLink': '免責聲明',
		'embed.video': 'YouTube 影片',
		'contact.name': '名稱',
		'contact.email': '電郵',
		'contact.content': '內容',
		'feedback.question': '這個網站對你有幫助嗎？',
		'feedback.low': '1 = 沒有幫助',
		'feedback.high': '5 = 非常有用',
		'feedback.message': '留幾句話鼓勵我們吧！',
		'form.send': '送出',
		'form.success': '謝謝你！訊息已經送出。',
		'form.error': '出了點問題，訊息沒有送出。請稍後再試。',
	},
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function useT(locale?: string) {
	const dict = ui[(locale ?? 'en') as keyof typeof ui] ?? ui.en;
	return (key: UiKey, vars: Record<string, string | number> = {}) =>
		Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), dict[key]);
}

/** Prefixes internal links with the locale; external links pass through. */
export const localize = (href: string, locale?: string) => (locale && href.startsWith('/') ? `/${locale}${href}` : href);
