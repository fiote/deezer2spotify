import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import MainView from '../../components/MainView';
import ContentPanel from '../../components/ContentPanel';

import './index.scss';

import api from '../../services/api';
import Swal from 'sweetalert2';

interface MoveFlowProps {
	location: {
		state: {
			source: string,
			target: string,
			items: any[]
		}
	}
}

const MoveFlow = (props: MoveFlowProps) => {
  	let { mergetype } = useParams();
	const history = useHistory();

	const [copylist,setCopylist] = useState<any[]>();
	const [qtDone,setQtDone] = useState<number>(0);
	const [qtSuccess,setQtSuccess] = useState<number>(0);
	const [qtFailed,setQtFailed] = useState<number>(0);
	const [qtTotal,setQtTotal] = useState<number>(0);
	const [currentItem,setCurrentItem] = useState<any>();

	const { source, target, items } = props.location.state;

	useEffect(() => {
		if (!currentItem) return;
		function goNext() {
			setQtDone(q => q+1);

			setCopylist(t => {
				var newlist = Array.from(t || []);
				newlist.shift();
				return newlist;
			});
		}

		function execLogout() {
			Swal.fire({title:'Ops!', html:'Looks like your '+target.toUpperCase()+' session expired. Please log in again and retry this!',icon:'warning'}).then(ev => {
				history.push('/'+mergetype);
			});
		}

		api.post('/'+target+'/find/'+mergetype,currentItem).then(response => {
			const feed = response.data;
			feed.status ? setQtSuccess(q => q+1) : setQtFailed(q => q+1);
			feed.logout ? execLogout() : goNext();
		}).catch(feed => {
			setQtFailed(q => q+1);
			console.error(feed);
		});
	},[currentItem,target,history,mergetype]);

	useEffect(() => {
		if (!copylist) return;
		let track = copylist[0];
		if (track) {
			setCurrentItem(track);
		} else {
			const extra = qtFailed ? ' (but we couldn\'t find a suitable match for <b>'+qtFailed+'</b> of them)' : '';
			Swal.fire({title:'Done!', html:'We finished moving your '+source.toUpperCase()+' '+mergetype+' to '+target.toUpperCase()+extra+'.',icon:'success'}).then(ev => {
				history.push('/'+mergetype);
			});
		}
	},[copylist]);

	useEffect(() => {
		setQtTotal(items.length);
		setCopylist(items);
	},[]);

	const title = 'Moving '+mergetype+'...';

	if (!currentItem) return <MainView title={title} loading='preparing list'/>;

	const ptext = (
		<div>
			{mergetype} moved: {qtSuccess}<br/>
			no match found: {qtFailed}
		</div>
	)


	let content = null;
	let imgAlt = null;

	if (mergetype === 'tracks') {
		content = (
			<>
				<div className="copy-title">{currentItem.title}</div>
				<div className="copy-details">{currentItem.artist}</div>
			</>
		)
		imgAlt = currentItem.title;
	}

	if (mergetype === 'albums') {
		content = (
			<>
				<div className="copy-title">{currentItem.album}</div>
				<div className="copy-details">{currentItem.artist}</div>
			</>
		)
		imgAlt = currentItem.album;
	}

	if (mergetype === 'artists') {
		content = (
			<div className="copy-title">{currentItem.artist}</div>
		)
		imgAlt = currentItem.artist;
	}

	return (
		<MainView progressbar={qtTotal ? qtDone*100/qtTotal : 0} progresstext={ptext} title={title} >
			<ContentPanel>
				<div className="copy-box">
					<div className="copy-number">{qtDone+1}/{qtTotal}</div>
					<img className="copy-cover" src={currentItem.image_url}  alt={imgAlt} />
					{content}
				</div>
			</ContentPanel>
		</MainView>
	)
}

export default MoveFlow;