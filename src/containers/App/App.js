import React from 'react';
import axios from 'axios';
import _ from 'lodash';
import classes from './style.scss';

const Status = {
	NOT_INITIALIZED: 'Loading set info from Hearthstone API...',
	NOT_LOADED: 'No collection loaded.',
	LOADING: 'Loading collection...',
	LOADED: 'Collection loaded.',
	COLLECTION_PRIVATE: 'Error: your collection is private.'
};

export default class App extends React.Component {
	state = {
		status: Status.NOT_INITIALIZED,
		username: 'tilastokeskus',
		standardCards: null,
		cards: [],
		deck: [],
		class: 'DRUID',
		format: 'wild',
		drafting: false,
		draft: [],
		showImageUrl: null
	};

	componentDidMount() {
		const mashapeKey = 'CLhsaznBXvmshFoN5ZsHgBSC0026p1p26vWjsn4Iu9UM7Du0YM';

		axios({
			method: 'get',
			url: 'https://omgvamp-hearthstone-v1.p.mashape.com/info',
			headers: {'X-Mashape-Key': mashapeKey}
		}).then(res => {
			const promises = res.data.standard.map(set => {
				return axios({
					method: 'get',
					url: `https://omgvamp-hearthstone-v1.p.mashape.com/cards/sets/${set}`,
					headers: {'X-Mashape-Key': mashapeKey}
				}).catch(err => {
					console.log('Could not fetch standard set: ' + set);
				});
			});

			Promise.all(promises).then(data => {
				let cards = [];
				data.forEach(obj => {
					if (obj) {
						cards = cards.concat(obj.data.map(card => card.name));
					}
				});

				this.setState({
					status: Status.NOT_LOADED,
					standardCards: cards
				});
			});
		});
	}

	handleInputChange = evt => {
		this.setState({username: evt.target.value});
	};

	handleClassChange = evt => {
		this.setState({class: evt.target.value});
	};

	handleFormatChange = evt => {
		this.setState({format: evt.target.value});
	};

	handleClickLoadBtn = () => {
		this.setState({status: Status.LOADING});

		const user = this.state.username;
		const url = `http://www.hearthpwn.com/members/${user}/collection`;
		axios.get(`http://cors-anywhere.herokuapp.com/${url}`).then(response => {
			this.parseData(response.data);
		});
	};

	handleClickLoadFileBtn = () => {
		this.setState({status: Status.LOADING});

		const reader = new FileReader();
		reader.onload = fileLoadedEvent => {
			const data = fileLoadedEvent.target.result;
			this.parseData(data);
		};

		const file = this.fileupload.files[0];
		reader.readAsText(file, "UTF-8");
	};

	handleClickGenerateDeckBtn = () => {
		const allCards = JSON.parse(JSON.stringify(this.state.cards));
		let allowedCards = allCards;
		if (this.state.format === 'standard') {
			allowedCards = allCards.filter(c => this.state.standardCards.includes(c.name));
		}

		const classCards = allowedCards.filter(c => c.class === this.state.class);
		const basicCards = allowedCards.filter(c => c.class === 'NONE');

		const deck = {};

		for (let i = 0; i < 30; i++) {
			const cards = Math.random() < 0.5 ? classCards : basicCards;

			const index = getRandomInt(0, cards.length - 1);
			const card = cards[index];

			if (!deck[card.id]) {
				deck[card.id] = {
					id: card.id,
					name: card.name,
					class: card.class,
					count: 0,
					manaCost: card.manaCost,
					rarity: card.rarity,
					imageUrl: card.imageUrl,
				};
			}

			deck[card.id].count++;
			card.count--;

			if (card.count === 0) {
				cards.splice(index, 1);
			}
		}

		const arr = Object.keys(deck).map(id => deck[id]);

		arr.sort((a, b) => {
			if (a.class !== b.class) {
				return a.class === 'NONE' ? 1 : -1;
			}

			if (a.manaCost !== b.manaCost) {
				return a.manaCost - b.manaCost;
			}

			return a.name.localeCompare(b.name);
		});

		this.setState({
			drafting: false,
			deck: arr
		});
	};

	handleClickArenaDraftBtn = () => {
		this.setState({
			drafting: true,
			deck: []
		});

		this.draft();
	};

	draft = () => {
		let r = Math.random() * 100;
		const round = this.state.deck.reduce((acc, c) => acc + c.count, 0);
		const rareRound = round === 0 || round === 10 || round === 20 || round === 30;
		while (rareRound && r < 76) {
			r = Math.random() * 100;
		}

		let rarity = 2;
		if (r >= 76 && r < 96) rarity = 3;
		if (r >= 96 && r < 99) rarity = 4;
		if (r >= 99) rarity = 5;

		const allCards = JSON.parse(JSON.stringify(this.state.cards)).filter(c => {
			return c.class === this.state.class || c.class === 'NONE';
		});

		let allowedCards = allCards;
		if (this.state.format === 'standard') {
			allowedCards = allCards.filter(c => this.state.standardCards.includes(c.name));
		}

		for (const card of this.state.deck) {
			const index = allowedCards.findIndex(c => c.id === card.id);
			if (index !== -1) {
				allowedCards[index].count -= card.count;
				if (allowedCards[index].count === 0) {
					allowedCards.splice(index, 1);
				}
			}
		}

		const cards = [];
		while (cards.length < 3) {
			const potentialCards = allowedCards.filter(c => {
				if (rarity <= 2) {
					return c.rarity <= 2;
				}

				return c.rarity === rarity;
			});

			const shuffled = _.shuffle(potentialCards);
			const needed = 3 - cards.length;
			const taken = _.take(shuffled, needed);
			cards.push(...taken);

			rarity--;
		}

		this.setState({draft: cards});
	};

	pickCard = card => {
		const index = this.state.deck.findIndex(c => c.id === card.id);

		const numCards = this.state.deck.reduce((acc, c) => acc + c.count, 0);
		const newDeck = JSON.parse(JSON.stringify(this.state.deck));
		if (index !== -1) {
			newDeck[index].count++;
		} else {
			card.count = 1;
			newDeck.push(card);
		}

		this.setState({
			drafting: numCards < 29,
			deck: newDeck
		});

		this.draft();
	};

	parseData = data => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(data, 'text/html');
		const isPrivate = doc.querySelector('.user-collection-private');

		if (isPrivate) {
			return this.setState({status: Status.COLLECTION_PRIVATE});
		}

		const cardElems = doc.querySelectorAll('.card-image-item.owns-card');

		const cards = Array.from(cardElems).map(elem => {
			const count = elem.querySelector('.inline-card-count').dataset.cardCount;
			const img = elem.querySelector('img');
			const rarity = parseInt(elem.dataset.rarity, 10);

			const maxCount = rarity === 5 ? 1 : 2;

			return {
				id: elem.dataset.id,
				name: elem.dataset.cardName,
				class: elem.dataset.cardClass,
				count: Math.min(maxCount, parseInt(count, 10)),
				manaCost: parseInt(elem.dataset.cardManaCost, 10),
				rarity,
				imageUrl: img.src
			}
		});

		this.setState({
			cards,
			status: Status.LOADED
		});
	};

	handleMouseOver = evt => {
		this.setState({showImageUrl: evt.target.parentNode.dataset.imageUrl});
	};

	handleMouseOut = evt => {
		this.setState({showImageUrl: null});
	};

	render() {
		return (
			this.state.status === Status.NOT_INITIALIZED ? <div>{this.state.status}</div> :
			<div>
				<div className={classes['input-area']}>
					<div className={classes['user-load']}>
						<label>Hearthpwn username</label>
						<input type="text" onChange={this.handleInputChange}
						       value={this.state.username}/>
						<input type="button" onClick={this.handleClickLoadBtn}
						       value="load user data"/>
					</div>
					<div className={classes['file-load']}>
						<label>Hearthpwn collection</label>
						<input type="file" ref={x => this.fileupload = x} />
						<input type="button" onClick={this.handleClickLoadFileBtn}
						       value="load file"/>
					</div>
				</div>
				{(this.state.status === Status.LOADING ||
					this.state.status === Status.NOT_LOADED ||
					this.state.status === Status.COLLECTION_PRIVATE) && this.state.status
				}
				{this.state.status === Status.LOADED &&
					<div className={classes.controls}>
						<select value={this.state.format} onChange={this.handleFormatChange}>
							<option value="wild">Wild</option>
							<option value="standard">Standard</option>
						</select>
						<select value={this.state.class} onChange={this.handleClassChange}>
							<option value="DRUID">Druid</option>
							<option value="HUNTER">Hunter</option>
							<option value="MAGE">Mage</option>
							<option value="PALADIN">Paladin</option>
							<option value="PRIEST">Priest</option>
							<option value="ROGUE">Rogue</option>
							<option value="SHAMAN">Shaman</option>
							<option value="WARLOCK">Warlock</option>
							<option value="WARRIOR">Warrior</option>
						</select>
						<input
							type="button"
							value="Generate deck"
							onClick={this.handleClickGenerateDeckBtn}
						/>
						<input
							type="button"
							value="Arena draft"
							onClick={this.handleClickArenaDraftBtn}
						/>
					</div>
				}
				{this.state.drafting &&
					<div className={classes['draft-div']}>
						{this.state.draft.map(card => {
							return (
								<img
									key={card.id}
									src={card.imageUrl}
									width="212"
									height="300"
								  onClick={() => this.pickCard(card)}
								/>
							);
						})}
					</div>
				}
				{this.state.deck.length > 0 &&
					<div className={classes.filedata}>
						<table>
							<thead>
							<tr>
								<th>Class</th>
								<th>Name</th>
								<th>Mana</th>
								<th>Count</th>
							</tr>
							</thead>
							<tbody>
							{this.state.deck.map(card => {
								const cls = card.class === 'NONE' ?
									'Neutral' :
									_.upperFirst(card.class.toLowerCase());

								return (
									<tr
										key={card.id}
										className={card.class === 'NONE' ? classes.basic : classes.class}
									  data-rarity={card.rarity}
									  data-image-url={card.imageUrl}
										onMouseOver={this.handleMouseOver}
										onMouseOut={this.handleMouseOut}
									>
										<td>{cls}</td>
										<td>{card.name}</td>
										<td>{card.manaCost}</td>
										<td>{card.count}</td>
									</tr>
								);
							})}
								<tr style={{fontWeight: 500}}>
									<td>Total</td>
									<td></td>
									<td></td>
									<td>{this.state.deck.reduce((acc, c) => acc + c.count, 0)}</td>
								</tr>
							</tbody>
						</table>
						{this.state.showImageUrl && <img src={this.state.showImageUrl} />}
					</div>
				}
			</div>
		);
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
