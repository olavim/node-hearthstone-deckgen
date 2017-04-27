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
	Chip,
	Slider,
	Toggle
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
import {Card, CardHeader, CardText} from 'material-ui/Card';
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

const CardClass = {
	DRUID: 'Druid',
	HUNTER: 'Hunter',
	MAGE: 'Mage',
	PALADIN: 'Paladin',
	PRIEST: 'Priest',
	ROGUE: 'Rogue',
	SHAMAN: 'Shaman',
	WARLOCK: 'Warlock',
	WARRIOR: 'Warrior'
};

export default class App extends React.Component {
	state = {
		status: Status.NOT_INITIALIZED,
		selectedFile: null,
		username: '',
		standardCards: null,
		cards: [],
		deck: [],
		class: 'RANDOM',
		randomClass: null,
		format: 'wild',
		drafting: false,
		draft: [],
		useClassCardPercentage: true,
		classCardPercentage: 0.5,
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

	handleClassCardPercentageChange = (evt, value) => {
		this.setState({classCardPercentage: value});
	};

	handleClickClassCardPercentageToggle = (evt, value) => {
		this.setState({useClassCardPercentage: value});
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
			deck: this.state.drafting ? [] : this.state.deck,
			drafting: false
		})
	};

	handleClickGenerateDeckBtn = () => {
		let cls = this.state.class;
		if (cls === 'RANDOM') {
			cls = _.sample(Object.keys(CardClass));
			this.setState({randomClass: cls});
		}

		const allCards = JSON.parse(JSON.stringify(this.state.cards));
		let allowedCards = allCards.filter(c => {
			return c.class === cls || c.class === 'NONE';
		});

		if (this.state.format === 'standard') {
			allowedCards = allCards.filter(c => this.state.standardCards.includes(c.name));
		}

		const classCards = allowedCards.filter(c => c.class === cls);
		const basicCards = allowedCards.filter(c => c.class === 'NONE');

		const deck = {};

		for (let i = 0; i < 30; i++) {
			let cards = allowedCards;
			if (this.state.useClassCardPercentage) {
				cards = Math.random() < this.state.classCardPercentage ? classCards : basicCards;
			}

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
			randomClass: _.sample(Object.keys(CardClass)),
			drafting: true,
			deck: []
		}, this.draft);
	};

	draft = () => {
		let r = Math.random() * 100;
		const round = this.state.deck.reduce((acc, c) => acc + c.count, 0);
		const rareRound = round === 0 || round === 9 || round === 19 || round >= 26;//
		while (rareRound && r < 68) {
			r = Math.random() * 100;
		}

		let rarity = 2;
		if (r >= 68 && r < 88) rarity = 3;
		if (r >= 88 && r < 97) rarity = 4;
		if (r >= 97) rarity = 5;

		const cls = this.state.class === 'RANDOM' ? this.state.randomClass : this.state.class;

		const allCards = JSON.parse(JSON.stringify(this.state.cards)).filter(c => {
			return c.class === cls || c.class === 'NONE';
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
			for (let i = 0; i < needed; i++) {
				if (shuffled.length === 0) {
					break;
				}

				// Class card boost.
				if (Math.random() < 0.2) {
					const index = shuffled.findIndex(c => c.class === cls);

					if (index !== -1) {
						const taken = shuffled.splice(index, 1)[0];
						cards.push(taken);
						continue;
					}
				}

				const taken = shuffled.splice(0, 1)[0];
				cards.push(taken);
			}

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
		}, this.draft);
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
						<Tab label="Load from HearthPwn">
							<div className={classes['input-area']}>
								<div className={classes.wrapper}>
									<TextField
										hintText="HearthPwn username"
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
						<Tab label="Load from HTML file">
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
					<Card>
						<CardHeader title="Selected cards"/>
						<CardText>
							<SelectField
								style={{width: '100%'}}
								floatingLabelText="Format"
								value={this.state.format}
								onChange={this.handleFormatChange}
							>
								<MenuItem value="wild" primaryText="Wild"/>
								<MenuItem value="standard" primaryText="Standard"/>
							</SelectField>
							<SelectField
								style={{width: '100%'}}
								floatingLabelText="Class"
								value={this.state.class}
								onChange={this.handleClassChange}
							>
								<MenuItem value="RANDOM" primaryText="Random"/>
								<Divider/>
								{Object.keys(CardClass).map(key => {
									return <MenuItem value={key} primaryText={CardClass[key]}/>
								})}
							</SelectField>
						</CardText>
					</Card>
					<Card expanded={this.state.useClassCardPercentage}>
						<CardHeader
							title="Class card percentage"
						  subtitle="Controls the likelyhood of a random card being a class card."
						  subtitleStyle={{fontWeight: 400}}
						/>
						<CardText>
							<Toggle
								toggled={this.state.useClassCardPercentage}
								onToggle={this.handleClickClassCardPercentageToggle}
								labelPosition="right"
								label={this.state.useClassCardPercentage ? 'Enabled' : 'Disabled'}
							/>
						</CardText>
						<CardText expandable={true}>
							<Slider
								onChange={this.handleClassCardPercentageChange}
								value={this.state.classCardPercentage}
							  disabled={!this.state.useClassCardPercentage}
							  sliderStyle={{margin: 0}}
							/>
							<label style={{color: '#888'}}>
								Probability: {Math.floor(this.state.classCardPercentage * 100)} %
							</label>
						</CardText>
					</Card>
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
