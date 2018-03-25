import React from 'react';
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip} from 'recharts';
import axios from 'axios';
import firebase from 'firebase';
const chartData = [
    {name: 'A', uv: 40, pv: 2400, amt: 2400},
    {name: 'B', uv: 30, pv: 1398, amt: 2210},
    {name: 'C', uv: 10, pv: 9800, amt: 2290},
    {name: 'D', uv: 27.8, pv: 3908, amt: 2000},
    {name: 'E', uv: 18.9, pv: 4800, amt: 2181},
    {name: 'F', uv: 23.9, pv: 3800, amt: 2500},
    {name: 'G', uv: 34.9, pv: 4300, amt: 2100},
];

class CustomAreaChart extends React.Component {

    constructor(props) {
        super(props);
          
        this.state = {
            data: [],
            date: []
        };
        
        this.getFitnessData = this.getFitnessData.bind(this);
        this.callback = this.callback.bind(this);
        this.setAuth = this.setAuth.bind(this);
    };

    componentWillMount() {

        var weeks = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        var date = new Date();
        var xlabels = [];
        for (let i=6; i>=0; i--){
            var day = date.getDay()-i-1 ;
            if (day < 0) day = day + 7;
            // xlabels[6 - i] = weeks[day] + ' ' + (date.getDate()-i);
            xlabels[6 - i] = (date.getDate()-i);
        }
        this.setState({date: xlabels});

        this.getFitnessData(this.props.access_token);
    }

    getFitnessData(accessToken){

		var current = new Date();
        var year = current.getFullYear();
        var month = current.getMonth();
        var date = current.getDate();

		var endTimeMillis = new Date(year, month, (date+1)).getTime();
		var startTimeMillis = endTimeMillis - 604800000;
		var dataTypeName = 'com.google.weight';
		
		var data = {
			"aggregateBy": [{"dataTypeName":dataTypeName}],
			"bucketByTime":{"durationMillis":86400000},
			"startTimeMillis":startTimeMillis,
			"endTimeMillis":endTimeMillis
		};

		var axiosconfig = {
			headers: { Authorization: `Bearer ${accessToken}`,
						'content-type': 'application/json'},
		};

		axios.post('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate?alt=json', data, axiosconfig)
        .then(response => this.callback(response))
		.catch(error => this.setAuth(error));
    }
    
    callback (response) {
        var data = response.data.bucket;
        var result = [];
        var count = data.length;
        for (let i = 0; i < count; i++) {
            if (data[i].dataset[0].point.length == 0) {
                result[i] = 0;
            } else {
                result[i] = data[i].dataset[0].point[0].value[0].fpVal;
            }
        }

        var date = this.state.date;
        var client_id='2fP7ys7alZRS6Xtg7SkQmSJ3Wqu1';
        for (let i = 0; i < count; i++) {
            chartData[i].name = date[i];
            chartData[i].val = result[i]; 
            // let dbCon3 = firebase.app().database().ref('/user/'+client_id+'/Weight/data/'+date[i]);
            // dbCon3.update({
            //   'weight': result[i]
            // });   
        }

        var prev5_date=date[0]-1; if(prev5_date<1){prev5_date=31+prev5_date;}
        var prev5_weight=75;
        //let dbCon3 = firebase.app().database().ref('/user/'+client_id+'/Weight/data/'+prev_date);
               
        // let prev_dt=dbCon3.on('value', function(snapshot){
        //     console.log (snapshot.val());
        // });
        if (chartData[0].val==0){chartData[0].val=prev5_weight};
        for (let i = 1; i < count; i++) {
            if (chartData[i].val==0){chartData[i].val=chartData[i-1].val};
        }        
              

        for (let i = 0; i < count; i++) {
            let dbCon3 = firebase.app().database().ref('/user/'+client_id+'/Weight/data/'+chartData[i].name);
            dbCon3.update({
              'weight': chartData[i].val
            });   
        }

        this.setState({data: chartData});
        console.log("updated good weight data.");
        //console.log(chartData);
        
    }

    setAuth (error) {
        this.props.setAuth();
    }

    render() {
        return (

            <AreaChart width={255} height={130} data={this.state.data}
                    margin={{top: 10, right: 0, left: -30, bottom: 0}}>
                <XAxis dataKey="name" stroke='#31BC7F' padding={{left: 0, right: 5}}/>
                <YAxis stroke='#31BC7F'/>
                <CartesianGrid strokeDasharray="1 1" vertical={false} stroke='#31BC7F'/>
                <Tooltip/>
                <Area type='monotone' dataKey='val' stroke='#31BC7F' fill='#b1a41d' dot={{ stroke: '#31BC7F', strokeWidth: 1, r: 2 }} activeDot={{r: 4}}/>
            </AreaChart>

        );
    }
}
export default CustomAreaChart;