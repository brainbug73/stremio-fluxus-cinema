const { config, proxy } = require('internal')
const hls = require('./hls')

const defaults = {
	name: 'Fluxus Cinema',
	prefix: 'fluxuscinema_',
	icon: 'https://3.bp.blogspot.com/-H29TnFg5qi8/XJRl9LkCOPI/AAAAAAAAERM/NMz9wJR8iksFemvDu1kGWb9soX41HopxgCLcBGAs/s1600/NewFTV-IPTV-C.png',
	paginate: 100
}

hls.init({ prefix: defaults.prefix, type: 'movie', config })

const defaultTypes = [
	{
		name: 'English',
		logo: 'https://2.bp.blogspot.com/-CvM-LO7iXBg/W6A1ttZh4oI/AAAAAAAAD7w/ATGTZyju0RsUbu0qXH-jWHFarGmiJd2qgCLcBGAs/s320/user-image-26861871-1507878696-59e06728edd66.jpeg',
		m3u: 'https://pastebin.com/raw/jbqA0j82'
	},
	{
		name: 'German',
		logo: 'https://2.bp.blogspot.com/-weojsNbSgmQ/W6A2vtOQvsI/AAAAAAAAD78/VkuiJnmO4Y0sBWAbK4GI3m3benvPFA4PQCLcBGAs/s320/german-language-movies.jpg',
		m3u: 'https://pastebin.com/raw/RZduJuKQ'
	},
	{
		name: 'French',
		logo: 'https://2.bp.blogspot.com/-Io8bKo-SvmQ/W6A3gO2QPuI/AAAAAAAAD8E/BxzXTUBKA2IaiP_52XW21utzkgvHchi5ACLcBGAs/s320/french-movies.jpg',
		m3u: 'https://pastebin.com/raw/cWbbtduU'
	},
	{
		name: 'Italian',
		logo: 'https://1.bp.blogspot.com/-lUIbZU139Bk/W6A5CMlUQ0I/AAAAAAAAD8Q/ZQCw6i_gyscc_RgLRIcq6y33J95nMkTjQCLcBGAs/s320/festival_2191.jpg',
		m3u: 'https://pastebin.com/raw/JkBfYpXz'
	},
	{
		name: 'Spanish',
		logo: 'https://4.bp.blogspot.com/-Ia25yoLDEZg/W6A6C_BrL3I/AAAAAAAAD8Y/U4X10jygsQsMALcVV3moHf-ZDt4qhqL-gCLcBGAs/s320/cine-espanol.jpg',
		m3u: 'https://pastebin.com/raw/U5Nai4hs'
	},
	{
		name: 'Portuguese',
		logo: 'https://1.bp.blogspot.com/-lUIbZU139Bk/W6A5CMlUQ0I/AAAAAAAAD8U/E4eOZiLgat8jEdvy47zIfK9IVMa675xYgCEwYBhgL/s320/festival_2191.jpg',
		m3u: 'https://pastebin.com/raw/FVAeAC0u'
	},
	{
		name: 'Japanese',
		logo: 'https://2.bp.blogspot.com/-HJyz1zmQTHY/W6A8YNH5RDI/AAAAAAAAD8k/0AWjMuYL5pY1R2c1ZPz6xhNicg3rnTU-ACLcBGAs/s320/7g_13moviescatchjff1600.jpg',
		m3u: 'https://pastebin.com/raw/wF35hqLF'
	},
	{
		name: 'Arabic',
		logo: 'https://1.bp.blogspot.com/-FRebpNurHQI/W6A9w2Q8DWI/AAAAAAAAD8w/mctTb80NUHYXT96JkLmt10ESBluRhfFGgCLcBGAs/s320/57753015749439760-jpg-15445294718296374.jpg',
		m3u: 'https://pastebin.com/raw/Sig2zWVH'
	},
]

const types = []

for (let i = 0; defaultTypes[i]; i++)
	if (config['show_'+i])
		types.push(defaultTypes[i])

const catalogs = []

if (config.style == 'Catalogs')
	for (let i = 0; types[i]; i++)
		if (types[i].m3u)
			catalogs.push({
				name: types[i].name,
				id: defaults.prefix + 'cat_' + i,
				type: 'movie',
				extra: [ { name: 'search' }, { name: 'skip' } ]
			})

function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
}

const { addonBuilder, getInterface, getRouter } = require('stremio-addon-sdk')

if (!catalogs.length)
	catalogs.push({
		id: defaults.prefix + 'cat',
		name: defaults.name,
		type: 'movie',
		extra: [{ name: 'search' }]
	})

const metaTypes = ['movie']

if (config.style == 'Channels')
	metaTypes.push('channel')

const builder = new addonBuilder({
	id: 'org.' + defaults.name.toLowerCase().replace(/[^a-z]+/g,''),
	version: '1.0.0',
	name: defaults.name,
	description: 'Movies from Fluxus Cinema. Includes: English, German, French, Italian, Spanish, Portuguese, Japanese and Arabic movies.',
	resources: ['stream', 'meta', 'catalog'],
	types: metaTypes,
	idPrefixes: [defaults.prefix],
	icon: defaults.icon,
	catalogs
})

builder.defineCatalogHandler(args => {
	return new Promise((resolve, reject) => {
		const extra = args.extra || {}

		if (config.style == 'Channels') {

			const metas = []

			for (let i = 0; types[i]; i++)
				if (types[i].m3u)
					metas.push({
						name: types[i].name,
						id: defaults.prefix + i,
						type: 'channel',
						poster: types[i].logo,
						posterShape: 'landscape',
						background: types[i].logo,
						logo: types[i].logo
					})

			if (metas.length) {
				if (extra.search) {
					let results = []
					metas.forEach(meta => {
						if (meta.name && meta.name.toLowerCase().includes(extra.search.toLowerCase()))
							results.push(meta)
					})
					if (results.length)
						resolve({ metas: results })
					else
						reject(defaults.name + ' - No search results for: ' + extra.search)
				} else
					resolve({ metas })
			} else
				reject(defaults.name + ' - No M3U URLs set')

		} else if (config.style == 'Catalogs') {

			const skip = parseInt(extra.skip || 0)
			const id = args.id.replace(defaults.prefix + 'cat_', '')

			hls.getM3U((types[id] || {}).m3u, id).then(metas => {
				if (!metas.length)
					reject(defaults.name + ' - Could not get items from M3U playlist: ' + args.id)
				else {
					if (!extra.search)
						resolve({ metas: metas.slice(skip, skip + defaults.paginate) })
					else {
						let results = []
						metas.forEach(meta => {
							if (meta.name && meta.name.toLowerCase().includes(extra.search.toLowerCase()))
								results.push(meta)
						})
						if (results.length)
							resolve({ metas: results })
						else
							reject(defaults.name + ' - No search results for: ' + extra.search)
					}
				}
			}).catch(err => {
				reject(err)
			})
		}
	})
})

builder.defineMetaHandler(args => {
	return new Promise((resolve, reject) => {
		if (config.style == 'Channels') {
			const i = args.id.replace(defaults.prefix, '')
			const meta = {
				name: types[i].name,
				id: defaults.prefix + i,
				type: 'channel',
				poster: types[i].logo,
				posterShape: 'landscape',
				background: types[i].logo,
				logo: types[i].logo
			}
			hls.getM3U(types[i].m3u).then(videos => {
				meta.videos = videos
				resolve({ meta })
			}).catch(err => {
				reject(err)
			})
		} else if (config.style == 'Catalogs') {
			const i = args.id.replace(defaults.prefix + 'url_', '').split('_')[0]
			hls.getM3U(types[i].m3u, i).then(metas => {
				let meta
				metas.some(el => {
					if (el.id == args.id) {
						meta = el
						return true
					}
				})
				if (meta)
					resolve({ meta })
				else
					reject(defaults.name + ' - Could not get meta item for: ' + args.id)
			}).catch(err => {
				reject(err)
			})
		} else
			console.log('err')
	})
})

builder.defineStreamHandler(args => {
	return new Promise(async (resolve, reject) => {
		if (config.style == 'Channels') {
			const url = decodeURIComponent(args.id.replace(defaults.prefix + 'url_', ''))
			const streams = await hls.processStream(proxy.addProxy(url))
			resolve({ streams: streams || [] })
		} else if (config.style == 'Catalogs') {
			const url = atob(decodeURIComponent(args.id.replace(defaults.prefix + 'url_', '').split('_')[1]))
			const streams = await hls.processStream(proxy.addProxy(url))
			resolve({ streams: streams || [] })
		}
	})
})

const addonInterface = getInterface(builder)

module.exports = getRouter(addonInterface)
