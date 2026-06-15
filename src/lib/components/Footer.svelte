<script lang="ts">
	import { base } from '$app/paths';
	import { Youtube, Github, Linkedin, ExternalLink } from "@lucide/svelte";
	import uvmLogo from '$lib/assets/images/UVM_Logo_Primary_Horiz_W_PunchOut.png';
	import vcsiLogo from '$lib/assets/images/bumper-sticker2-white-transparent.png';

	let { theme }: { theme?: 'light' | 'dark' } = $props();
</script>

<footer
	class={[
		'footer',
		theme === 'light' && 'theme-light',
		theme === 'dark' && 'theme-dark'
	]}
>
	<div class="footer-content">
		<div class="footer-logo">
			<div class="logo-row">
				<img src={uvmLogo} alt="UVM Logo" class="uvm-logo-img" />
				<img src={vcsiLogo} alt="VCSI Logo" class="roboctopus-logo-img" />
			</div>
			<ul class="social-icons">
				<li>
					<a href="https://www.youtube.com/@UVMcomplexity" target="_blank" rel="noreferrer" aria-label="YouTube">
						<Youtube class="icon" size={20} />
					</a>
				</li>
				<li>
					<a href="https://github.com/Vermont-complex-systems" target="_blank" rel="noreferrer" aria-label="GitHub">
						<Github class="icon" size={20} />
					</a>
				</li>
				<li>
					<a href="https://bsky.app/profile/vcsi.bsky.social" target="_blank" rel="noreferrer" aria-label="Bluesky">
						<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
						</svg>
					</a>
				</li>
				<li>
					<a href="https://linkedin.com/school/uvm-vcsc/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
						<Linkedin class="icon" size={20} />
					</a>
				</li>
			</ul>
		</div>

		<!-- <div class="footer-section">
			<h3>Community</h3>
			<ul>
				<li><a href="{base}/">Home</a></li>
			</ul>
		</div> -->

		<div class="footer-section">
			<h3>Research</h3>
			<ul>
				<li><a href="https://vermontcomplexsystems.org/projects">Projects</a></li>
				<li><a href="https://vermontcomplexsystems.org/research/group">Groups</a></li>
				<li><a href="https://vermontcomplexsystems.org/explore">Explore</a></li>
				<li><a href="https://vermontcomplexsystems.org/funding">Funding</a></li>
				<li><a href="https://verso.w3.uvm.edu/" target="_blank" rel="noopener noreferrer">VERSO <ExternalLink size={14} /></a></li>
				<li><a href="https://vermontcomplexsystems.org/research/mass-mutual">Mass Mutual Center of Excellence</a></li>
				<li><a href="https://vermontcomplexsystems.org/research/tgir">TGIR Research</a></li>
				<li><a href="https://www.nature.com/npjcomplex/" target="_blank" rel="noopener noreferrer">npj Complexity <ExternalLink size={14} /></a></li>
			</ul>
		</div>

		<div class="footer-section">
			<h3>Education</h3>
			<ul>
				<li><a href="https://vermontcomplexsystems.org/education/undergraduate">Undergraduate</a></li>
				<li><a href="https://vermontcomplexsystems.org/education/masters">Masters</a></li>
				<li><a href="https://vermontcomplexsystems.org/education/certificate">Certificate</a></li>
				<li><a href="https://vermontcomplexsystems.org/education/phd">PhD</a></li>
				<li><a href="https://vermontcomplexsystems.org/education/BilDS">BilDS</a></li>
			</ul>
		</div>

		<div class="footer-bottom">
			<a class="cc-footer-copy" href="https://www.uvm.edu/equal-opportunity/americans-disabilities-act-and-reasonable-accommodations" target="_blank" rel="noreferrer">
				<span class="link-text">Accessibility <ExternalLink class="icon" size={14} /></span>
			</a>
			<a class="cc-footer-copy" href="https://www.uvm.edu/compliance/website-privacy-policy/terms-use" target="_blank" rel="noreferrer">
				<span class="privacy-text">Privacy/Terms of Use <ExternalLink class="icon" size={14} /></span>
			</a>
			<div class="cc-footer-copy">© 2026, Vermont Complex Systems Institute at UVM</div>
		</div>
	</div>
</footer>

<style>
.footer {
	width: 100%;
	background-color: var(--footer-bg, var(--vcsi-color-uvm-green));
	border-top: 1px solid var(--footer-border, rgba(255, 255, 255, 0.2));
	padding: var(--vcsi-space-2xl, 3rem) 0 var(--vcsi-space-xl, 2rem);
	box-sizing: border-box;
}

/* Global dark mode — only when no explicit theme prop */
:global(.dark) .footer:not(.theme-light):not(.theme-dark) {
	background-color: var(--footer-bg, rgb(45, 45, 45));
	border-top-color: var(--footer-border, rgba(255, 255, 255, 0.1));
}

/* theme="light" — forces UVM green regardless of global mode */
.footer.theme-light {
	background-color: var(--vcsi-color-uvm-green);
	border-top-color: rgba(255, 255, 255, 0.2);
}

/* theme="dark" — forces dark regardless of global mode */
.footer.theme-dark {
	background-color: rgb(45, 45, 45);
	border-top-color: rgba(255, 255, 255, 0.1);
}

.footer-content {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
	max-width: var(--vcsi-page-max-width);
	margin-inline: auto;
	padding-inline: var(--vcsi-page-inline-padding);
	align-items: start;
}

.footer-section h3 {
	font-family: var(--vcsi-font-mono);
	font-weight: var(--vcsi-font-weight-bold);
	text-transform: uppercase;
	font-size: var(--vcsi-font-size-small);
	margin: 0 0 0.75rem;
	color: var(--vcsi-color-uvm-gold);
}

:global(.dark) .footer-section h3 {
	color: var(--vcsi-gray-100);
}

.footer-section ul {
	list-style: none;
	padding: 0;
	margin: 0;
	color: var(--vcsi-gray-100);
}

.footer-section li {
	margin-bottom: 0.5rem;
}

.footer-section a {
	color: var(--vcsi-color-white);
	text-decoration: underline;
	font-weight: 500;
	font-size: 0.95rem;
	transition: color var(--vcsi-transition-base);
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

:global(.dark) .footer-section a {
	color: var(--vcsi-color-uvm-gold);
}

.footer-section a:hover {
	color: var(--vcsi-color-uvm-gold);
}

:global(.dark) .footer-section a:hover {
	color: var(--vcsi-gray-100);
}

.social-icons {
	display: flex;
	gap: 1rem;
	list-style: none;
	padding: 0;
	margin: 0;
}

.social-icons a {
	text-decoration: none;
}

.footer-logo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	max-width: 12rem;
	min-width: 0;
	gap: 0.5rem;
	overflow: hidden;
}

.footer-logo a {
	color: var(--vcsi-color-uvm-gold);
}

.uvm-logo-img {
	height: auto;
	max-height: 3rem;
	border-radius: 3px;
}

.uvm-logo-img {
	transition: transform var(--vcsi-transition-base);
}

.roboctopus-logo-img {
	width: auto;
	max-width: 100%;
	height: auto;
	max-height: 2.3rem;
	border-radius: 3px;
	object-fit: contain;
}

.roboctopus-logo-img {
	margin-bottom: 0.5rem;
	transition: transform var(--vcsi-transition-base);
	align-self: flex-start;
}

.roboctopus-logo-img:hover {
	transform: scale(1.05);
}

.footer-bottom {
	grid-column: 1 / -1;
	display: flex;
	gap: 1.5rem;
	align-items: center;
	padding-top: 1.5rem;
	margin-top: 1rem;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
}

:global(.dark) .footer-bottom {
	border-top-color: var(--vcsi-gray-700);
}

.footer-bottom .cc-footer-copy:last-child {
	margin-left: auto;
}

.cc-footer-copy {
	color: rgba(245, 245, 245, 0.9);
	font-weight: 500;
	font-size: 1rem;
	transition: color var(--vcsi-transition-base);
	text-align: left;
	display: block;
}

.link-text,
.privacy-text {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	flex-wrap: nowrap;
}

.privacy-text {
	line-height: 1.2;
}

.link-text :global(.icon),
.privacy-text :global(.icon) {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
	transform: translateY(-0.1rem);
}

:global(.dark) .cc-footer-copy {
	color: var(--vcsi-gray-300);
}

.cc-footer-copy:hover {
	color: var(--vcsi-gray-300);
}

:global(.dark) .cc-footer-copy:hover {
	color: var(--vcsi-gray-100);
}

.cc-footer-copy:not(a) {
	color: rgba(245, 245, 245, 0.9);
	text-decoration: none;
}

:global(.dark) .cc-footer-copy:not(a) {
	color: var(--vcsi-gray-300);
}

@media (max-width: 768px) {
	.footer {
		padding: 2rem 1rem 1.5rem;
	}

	.footer-content {
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem 1rem;
	}

	.footer-logo {
		grid-column: 1 / 3;
		grid-row: 1;
		max-width: 100%;
		gap: 0.75rem;
	}

	.logo-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		width: 100%;
	}

	.footer-logo .uvm-logo-img,
	.footer-logo .roboctopus-logo-img {
		max-width: 40%;
		flex: 0 1 auto;
	}

	.footer-section:nth-child(2) { grid-column: 1; grid-row: 2; }
	.footer-section:nth-child(3) { grid-column: 2; grid-row: 2; }
	.footer-section:nth-child(4) { grid-column: 1; grid-row: 3; }

	.footer-bottom {
		grid-column: 1 / 3;
		grid-row: 4;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.footer-bottom .cc-footer-copy:last-child {
		width: 100%;
	}

	.footer-section h3 {
		font-size: clamp(12px, 1vw, 0.8rem);
	}

	.footer-section a {
		font-size: clamp(12px, 1vw, 0.8rem);
	}

	.footer-section li {
		margin-bottom: 0.3rem;
	}

	.cc-footer-copy {
		font-size: 0.85rem;
	}
}
</style>
