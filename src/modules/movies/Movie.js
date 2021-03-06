import React, { Component, PropTypes } from 'react';
import {
	Image,
	Linking,
	RefreshControl,
	ScrollView,
	Text,
	ToastAndroid,
	TouchableOpacity,
	View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import Swiper from 'react-native-swiper';
import axios from 'axios';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as moviesActions from './movies.actions';
import Casts from './tabs/Casts';
import DefaultTabBar from '../_global/scrollableTabView/DefaultTabBar';
import Info from './tabs/Info';
import ShowInfo from './tabs/ShowInfo';
import ProgressBar from '../_global/ProgressBar';
import Trailers from './tabs/Trailers';
import styles from './styles/Movie';
import { TMDB_IMG_URL, YOUTUBE_API_KEY, YOUTUBE_URL } from '../../constants/api';
import Share from 'react-native-share';

class Movie extends Component {
	constructor(props) {
		super(props);

		this.state = {
			castsTabHeight: null,
			heightAnim: null,
			infoTabHeight: null,
			isLoading: true,
			isRefreshing: false,
			showSimilarMovies: true,
			trailersTabHeight: null,
			tab: 0,
			youtubeVideos: []
		};

		this._getTabHeight = this._getTabHeight.bind(this);
		this._onChangeTab = this._onChangeTab.bind(this);
		this._onContentSizeChange = this._onContentSizeChange.bind(this);
		this._onRefresh = this._onRefresh.bind(this);
		this._onScroll = this._onScroll.bind(this);
		this._viewMovie = this._viewMovie.bind(this);
		this._openYoutube = this._openYoutube.bind(this);
		this.props.navigator.setOnNavigatorEvent(this._onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		this._retrieveDetails();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.details) this.setState({ isLoading: false });
	}

	_retrieveDetails(isRefreshed) {
		this.props.actions.retrieveMovieDetails(this.props.type, this.props.movieId)
			.then(() => {
				this._retrieveYoutubeDetails();
			});
		if (isRefreshed && this.setState({ isRefreshing: false }));
	}

	_retrieveSimilarMovies() {
		this.props.actions.retrieveSimilarMovies(this.props.movieId, 1);
	}

	_onRefresh() {
		this.setState({ isRefreshing: true });
		this._retrieveDetails('isRefreshed');
	}

	_onScroll(event) {
		const contentOffsetY = event.nativeEvent.contentOffset.y.toFixed();
		if (contentOffsetY > 150) {
			this._toggleNavbar('hidden');
		} else {
			this._toggleNavbar('shown');
		}
	}

	_toggleNavbar(status) {
		this.props.navigator.toggleNavBar({
			to: status,
			animated: true
		});
	}

	_onChangeTab({ i, ref }) {
		this.setState({ tab: i });
	}

	// ScrollView onContentSizeChange prop
	_onContentSizeChange(width, height) {
		if (this.state.tab === 0 && this.state.infoTabHeight === this.state.castsTabHeight) {
			this.setState({ infoTabHeight: height });
		}
	}

	_getTabHeight(tabName, height) {
		if (tabName === 'casts') this.setState({ castsTabHeight: height });
		if (tabName === 'trailers') this.setState({ trailersTabHeight: height });
	}

	_retrieveYoutubeDetails() {
		this.props.details.videos.results.map(item => {
			const request = axios.get(`${YOUTUBE_URL}/?id=${item.key}&key=${YOUTUBE_API_KEY}&part=snippet`)
								.then(res => {
									const data = this.state.youtubeVideos;
									data.push(res.data.items[0]);
								});
			return request;
		});
	}

	_viewMovie(movieId) {
		this.props.navigator.push({
			screen: 'movieapp.Movie',
			passProps: {
				movieId,
				type: this.props.type
			}
		});
	}

	_openYoutube(youtubeUrl) {
		Linking.canOpenURL(youtubeUrl).then(supported => {
			if (supported) {
				Linking.openURL(youtubeUrl);
			} else {
				ToastAndroid.show(`RN Don't know how to handle this url ${youtubeUrl}`, ToastAndroid.SHORT);
			}
		});
	}

	_onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'close') {
				this.props.navigator.dismissModal();
			}
		}
	}

	_OnPressShareButton(type) {
		const { details } = this.props;
		let shareOptions = {
      title: details.original_title || details.original_name,
      message: details.overview,
      url: details.homepage,
      subject: "Share Link" //  for email
    };
		Share.shareSingle(Object.assign(shareOptions, {
	    "social": type
	  }));
	}

	render() {
		const iconStar = <Icon name="md-star" size={16} color="#F5B642" />;
		const iconFacebook = <Icon name="logo-facebook" size={32} color="#F5B642" />;
		const iconTwitter = <Icon name="logo-twitter" size={32} color="#F5B642" />;
		const iconGooglePlus = <Icon name="logo-googleplus" size={32} color="#F5B642" />;
		const { details } = this.props;
		const info = details;

		let height;
		if (this.state.tab === 0) height = this.state.infoTabHeight;
		if (this.state.tab === 1) height = this.state.castsTabHeight;
		if (this.state.tab === 2) height = this.state.trailersTabHeight;

		return (
			this.state.isLoading ? <View style={styles.progressBar}><ProgressBar /></View> :
			<ScrollView
					style={styles.container}
					onScroll={this._onScroll.bind(this)}
					scrollEventThrottle={100}
					onContentSizeChange={this._onContentSizeChange}
					refreshControl={
						<RefreshControl
							refreshing={this.state.isRefreshing}
							onRefresh={this._onRefresh}
							colors={['#EA0000']}
							tintColor="white"
							title="loading..."
							titleColor="white"
							progressBackgroundColor="white"
						/>
					}>
				<View style={{ height }}>
					<Swiper
						style={styles.swiper}
						autoplay
						autoplayTimeout={4}
						showsPagination={false}
						height={248}
						loop
						index={5}>
						{
							info.images.backdrops.map((item, index) => (
								<View key={index}>
									<Image source={{ uri: `${TMDB_IMG_URL}/w780/${(item.file_path)}` }} style={styles.imageBackdrop} />
									<LinearGradient colors={['rgba(0, 0, 0, 0.2)', 'rgba(0,0,0, 0.2)', 'rgba(0,0,0, 0.7)']} style={styles.linearGradient} />
								</View>
							))
						}
					</Swiper>
					<View style={styles.cardContainer}>
						<Image source={{ uri: `${TMDB_IMG_URL}/w185/${info.poster_path}` }} style={styles.cardImage} />
						<View style={styles.cardDetails}>
							<View style={{flex:1, flexDirection:'row',justifyContent:'space-between'}}>
								<Text style={styles.cardTitle}>{info.original_title || info.original_name}</Text>
								<TouchableOpacity><Icon name="md-more" style={styles.option}/></TouchableOpacity>
							</View>
							<Text style={styles.cardTagline}>{info.tagline}</Text>
							<View style={styles.cardGenre}>
								<Text style={styles.cardGenreItem}>{info.genres.map(item => item.name).join(', ')}</Text>
							</View>
							{
								!!info.homepage && (
									<View style={styles.cardButtonGroup}>
										<TouchableOpacity style={styles.cardButton} onPress={this._OnPressShareButton.bind(this, 'facebook')}>
											{iconFacebook}
										</TouchableOpacity>
										<TouchableOpacity style={styles.cardButton} onPress={this._OnPressShareButton.bind(this, 'twitter')}>
											{iconTwitter}
										</TouchableOpacity>
										<TouchableOpacity style={styles.cardButton} onPress={this._OnPressShareButton.bind(this, 'googleplus')}>
											{iconGooglePlus}
										</TouchableOpacity>
									</View>
								)
							}


						</View>
					</View>
					<View style={styles.contentContainer}>

						<ScrollableTabView
							onChangeTab={this._onChangeTab}
							renderTabBar={() => (
								<DefaultTabBar
									textStyle={styles.textStyle}
									underlineStyle={styles.underlineStyle}
									style={styles.tabBar}
								/>
							)}>
							{
								!!info.casts && (
									<Casts tabLabel="CASTS" info={info} getTabHeight={this._getTabHeight} />
								)
							}
							{
								this.props.type === 'movie' && (
									<Info tabLabel="INFO" info={info} />
								)
							}
							{
								this.props.type === 'tv' && (
									<ShowInfo tabLabel="INFO" info={info} />
								)
							}
							<Trailers tabLabel="TRAILERS" youtubeVideos={this.state.youtubeVideos} openYoutube={this._openYoutube} getTabHeight={this._getTabHeight} />
						</ScrollableTabView>
					</View>
				</View>
			</ScrollView>
		);
	}
}

Movie.navigatorStyle = {
	navBarTransparent: true,
	drawUnderNavBar: true,
	navBarTranslucent: true,
	statusBarHidden: true,
	navBarTextColor: 'white',
	navBarButtonColor: 'white'
};

Movie.propTypes = {
	actions: PropTypes.object.isRequired,
	details: PropTypes.object.isRequired,
	navigator: PropTypes.object,
	movieId: PropTypes.number.isRequired,
	type: PropTypes.string.isRequired
};

function mapStateToProps(state, ownProps) {
	return {
		details: state.movies.details
	};
}

function mapDispatchToProps(dispatch) {
	return {
		actions: bindActionCreators(moviesActions, dispatch)
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(Movie);
