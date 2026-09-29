declare namespace App {
	interface Locals {
		/** Child pages of the section whose overview page is being rendered (see src/routeData.ts). */
		sectionEntries?: import('@astrojs/starlight/route-data').StarlightRouteData['sidebar'];
	}
}
