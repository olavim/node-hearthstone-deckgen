import React from 'react';
import axios from 'axios';
import _ from 'lodash';
import {
	TextField,
	RaisedButton,
	FlatButton,
	Divider,
	Paper,
	MenuItem,
	SelectField,
	Dialog,
	IconButton,
	Chip
} from 'material-ui';
import {
	Table,
	TableBody,
	TableHeader,
	TableHeaderColumn,
	TableRow,
	TableRowColumn
} from 'material-ui/Table';
import {Tabs, Tab} from 'material-ui/Tabs';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import FileUploadIcon from 'material-ui/svg-icons/file/file-upload';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
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
		selectedFile: null,
		username: '',
		standardCards: null,
		cards: [],
		deck: [],
		class: 'DRUID',
		format: 'wild',
		drafting: false,
		draft: [],
		showImageUrl: null,
		showImageX: 0,
		showImageY: 0,
		showSettings: false
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

	handleFileChange = evt => {
		this.setState({selectedFile: evt.target.value});
	};

	handleClassChange = (evt, index, value) => {
		this.setState({class: value});
		this.handleSettingsChanged();
	};

	handleFormatChange = (evt, index, value) => {
		this.setState({format: value});
		this.handleSettingsChanged();
	};

	handleClickSettingsBtn = () => {
		this.setState({showSettings: true});
	};

	handleCloseSettings = () => {
		this.setState({showSettings: false});
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

	handleSettingsChanged = () => {
		this.setState({
			deck: [],
			drafting: false
		})
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

	handleMouseMove = evt => {
		this.setState({
			showImageUrl: evt.target.parentNode.dataset.imageUrl,
			showImageX: Math.min(evt.clientX, window.innerWidth - 300),
			showImageY: Math.min(evt.clientY, window.innerHeight - 450)
		});
	};

	handleMouseLeave = () => {
		console.log('leave')
		this.setState({showImageUrl: null});
	};

	render() {
		return (
			this.state.status === Status.NOT_INITIALIZED ?
				<RefreshIndicator
					size={50}
					left={window.innerWidth / 2}
					top={window.innerHeight / 4}
					status="loading"
				/> :
			<div className={classes.app}>
				<Paper>
					<Tabs>
						<Tab label="Load with hearthpwn username">
							<div className={classes['input-area']}>
								<div className={classes.wrapper}>
									<TextField
										hintText="Hearthpwn username"
										onChange={this.handleInputChange}
										name="name"
										value={this.state.username}
										style={{flex: 1}}
									/>
									<FlatButton
										onClick={this.handleClickLoadBtn}
										label="load collection"
										style={{flex: 1, marginLeft: '10px'}}
									/>
								</div>
							</div>
						</Tab>
						<Tab label="Load with HTML file">
							<div className={classes['input-area']}>
								<div className={classes.wrapper}>
									<div className={classes['file-label-wrapper']}>
										<label>{this.state.selectedFile}</label>
									</div>
									<RaisedButton
										secondary
										icon={<FileUploadIcon />}
										containerElement='label'
										label='Select file'
										style={{flex: '0 0 auto'}}
										buttonStyle={{borderRadius: '0 2px 2px 0'}}
									>
										<input
											type="file"
											className="hidden"
											ref={x => this.fileupload = x}
										  onChange={this.handleFileChange}
										/>
									</RaisedButton>
									<FlatButton
										onClick={this.handleClickLoadFileBtn}
										label="load collection"
										style={{flex: 1, marginLeft: '10px'}}
									/>
								</div>
							</div>
						</Tab>
					</Tabs>
				</Paper>
				<Divider style={{margin: '10px 0'}} />
				<Paper>
					{this.state.status === Status.COLLECTION_PRIVATE &&
						<div style={{padding: '12px'}}>{this.state.status}</div>
					}
					{this.state.status === Status.LOADED &&
						<Toolbar>
							<ToolbarGroup firstChild>
								<IconButton onClick={this.handleClickSettingsBtn}>
									<SettingsIcon/>
								</IconButton>
							</ToolbarGroup>
							<ToolbarGroup>
								<FlatButton
									label="Generate deck"
									onClick={this.handleClickGenerateDeckBtn}
								/>
								<FlatButton
									label="Arena draft"
									onClick={this.handleClickArenaDraftBtn}
								/>
							</ToolbarGroup>
						</Toolbar>
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
							<Table>
								<TableHeader
									displaySelectAll={false}
									adjustForCheckbox={false}
								>
									<TableRow>
										<TableHeaderColumn>Class</TableHeaderColumn>
										<TableHeaderColumn>Name</TableHeaderColumn>
										<TableHeaderColumn>Mana</TableHeaderColumn>
										<TableHeaderColumn>Count</TableHeaderColumn>
										<TableHeaderColumn style={{width: '20px'}}/>
									</TableRow>
								</TableHeader>
								<TableBody displayRowCheckbox={false}>
								{this.state.deck.map(card => {
									const cls = card.class === 'NONE' ?
										'Neutral' :
										_.upperFirst(card.class.toLowerCase());

									return (
										<TableRow
											key={card.id}
											className={card.class === 'NONE' ? classes.basic : classes.class}
										  data-image-url={card.imageUrl}
											onMouseMove={this.handleMouseMove}
											onMouseLeave={this.handleMouseLeave}
										  style={{height: '30px'}}
										>
											<TableRowColumn style={{height: '30px'}}>
												<Chip
													backgroundColor={cls === 'Neutral' ? undefined : '#b2e7ff'}
													labelStyle={{fontSize: '12px', lineHeight: '24px'}}
												>
													{cls}
												</Chip>
											</TableRowColumn>
											<TableRowColumn style={{height: '30px'}}>{card.name}</TableRowColumn>
											<TableRowColumn style={{height: '30px'}}>{card.manaCost}</TableRowColumn>
											<TableRowColumn style={{height: '30px'}}>{card.count}</TableRowColumn>
											<TableRowColumn style={{height: '30px', width: '20px'}}>
												<div data-rarity={card.rarity} className={classes.rarity}/>
											</TableRowColumn>
										</TableRow>
									);
								})}
									<TableRow style={{fontWeight: 500}}>
										<TableRowColumn>Total</TableRowColumn>
										<TableRowColumn></TableRowColumn>
										<TableRowColumn></TableRowColumn>
										<TableRowColumn>
											{this.state.deck.reduce((acc, c) => acc + c.count, 0)}
										</TableRowColumn>
										<TableRowColumn></TableRowColumn>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					}
				</Paper>
				{this.state.status === Status.LOADING &&
					<RefreshIndicator
						size={50}
						left={window.innerWidth / 2}
						top={window.innerHeight / 4}
						status="loading"
					/>
				}
				<Dialog
					title="Settings"
					open={this.state.showSettings}
				  onRequestClose={this.handleCloseSettings}
				  actions={[
				  	<FlatButton label="Close" onClick={this.handleCloseSettings}/>
				  ]}
			  >
					<SelectField
						floatingLabelText="Format"
						value={this.state.format}
						onChange={this.handleFormatChange}
					>
						<MenuItem value="wild" primaryText="Wild"/>
						<MenuItem value="standard" primaryText="Standard"/>
					</SelectField>
					<SelectField
						floatingLabelText="Class"
						value={this.state.class}
						onChange={this.handleClassChange}
					>
						<MenuItem value="DRUID" primaryText="Druid"/>
						<MenuItem value="HUNTER" primaryText="Hunter"/>
						<MenuItem value="MAGE" primaryText="Mage"/>
						<MenuItem value="PALADIN" primaryText="Paladin"/>
						<MenuItem value="PRIEST" primaryText="Priest"/>
						<MenuItem value="ROGUE" primaryText="Rogue"/>
						<MenuItem value="SHAMAN" primaryText="Shaman"/>
						<MenuItem value="WARLOCK" primaryText="Warlock"/>
						<MenuItem value="WARRIOR" primaryText="Warrior"/>
					</SelectField>
				</Dialog>
				{this.state.showImageUrl &&
					<img
						src={this.state.showImageUrl}
					  style={{
					  	zIndex: 999,
					  	pointerEvents: 'none',
					  	position: 'absolute',
						  left: this.state.showImageX + 'px',
						  top: this.state.showImageY + 'px',
					  }}
					/>
				}
			</div>
		);
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
