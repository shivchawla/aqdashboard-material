import React, { Component } from 'react';
import _ from 'lodash';
import Utils from './../../Utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import BacktestsTable from './BacktestsTable';
import axios from 'axios';
import AqDesktopLayout from '../../components/Layout/AqDesktopLayout';
import { withRouter } from 'react-router-dom';
import {processBacktests} from './utils';
// import Compare from './../Compare/Compare.jsx';


class StrategyBacktests extends Component {

    _mounted = false;
    cancelGetBackTests = undefined;
    cancelGetStrategy = undefined;
    deletesCompleted = 0;

    constructor(props) {
        super();
        this.state = {
            'loading': true,
            'selectedBacktests': [],
            'strategy': {},
            'backtests': [],
            'allSelected': false,
            'disableRunTests': false,
            'tableButtonsLoading': false,
            'backtestsCompareModalVisible': false,
        };

        this.updateState = (data) => {
            if (this._mounted) {
                this.setState(data);
            }
        }

        this.getStrategy = () => {
            axios(Utils.getBaseUrl() + '/strategy/' + props.match.params.strategyId, {
                cancelToken: new axios.CancelToken((c) => {
                    // An executor function receives a cancel function as a parameter
                    this.cancelGetStrategy = c;
                }),
                'headers': Utils.getAuthTokenHeader()
            })
                .then((response) => {
                    if (response.data && response.data.forwardtest &&
                        response.data.forwardtest.active) {
                        this.updateState({ 'strategy': response.data, 'disableRunTests': true });
                    } else {
                        this.updateState({ 'strategy': response.data });
                    }
                    this.getAllBacktests();
                    this.cancelGetStrategy = undefined;
                })
                .catch((error) => {
                    Utils.checkForInternet(error, this.props.history);
                    if (error.response) {
                        if (error.response.status === 400 || error.response.status === 403) {
                            this.props.history.push('/forbiddenAccess');
                        }
                        Utils.checkErrorForTokenExpiry(error, this.props.history, this.props.match.url);
                    }
                    this.updateState({
                        'backtests': [],
                        'loading': false
                    });
                    this.cancelGetStrategy = undefined;
                });
        }

        this.getAllBacktests = () => {
            axios(Utils.getBaseUrl() + '/strategy/' + props.match.params.strategyId + '/backtests?skip=0&limit=0', {
                cancelToken: new axios.CancelToken((c) => {
                    // An executor function receives a cancel function as a parameter
                    this.cancelGetBackTests = c;
                }),
                'headers': Utils.getAuthTokenHeader()
            })
                .then((response) => {
                    const backtests = processBacktests(response.data);
                    this.updateState({backtests, loading: false});
                    this.cancelGetBackTests = undefined;
                })
                .catch((error) => {
                    Utils.checkForInternet(error, this.props.history);
                    if (error.response) {
                        if (error.response.status === 400 || error.response.status === 403) {
                            this.props.history.push('/forbiddenAccess');
                        }
                        Utils.checkErrorForTokenExpiry(error, this.props.history, this.props.match.url);
                    }
                    this.updateState({
                        'backtests': [],
                        'loading': false
                    });
                    this.cancelGetBackTests = undefined;
                });
        }

        this.runForwardTestApiCall = (backtestId) => {
            axios({
                'method': 'post',
                'url': Utils.getBaseUrl() + '/forwardtest',
                'data': {
                    "strategyId": this.props.match.params.strategyId,
                    "backtestId": backtestId
                },
                'headers': Utils.getAuthTokenHeader()
            })
                .then((response) => {
                    this.props.history.push('/research');
                })
                .catch((error) => {
                    Utils.checkForInternet(error, this.props.history);
                    if (error.response) {
                        if (error.response.status === 400 || error.response.status === 403) {
                            this.props.history.push('/forbiddenAccess');
                        }
                        Utils.checkErrorForTokenExpiry(error, this.props.history, this.props.match.url);
                    }
                    this.removeAllLoading();
                });
        }

        this.removeAllLoading = () => {
            let backtests = JSON.parse(JSON.stringify(this.state.backtests));
            for (let i = 0; i < backtests.length; i++) {
                if (backtests[i].isLoading) {
                    backtests[i]['isLoading'] = false;
                }
            }
            this.updateState({ 'backtests': backtests });
        }

        this.strategyCheckBoxChange = (state, backtestId) => {
            let startegyIds = JSON.parse(JSON.stringify(this.state.selectedBacktests));
            let indexOfId = startegyIds.indexOf(backtestId);
            if (state) {
                if (indexOfId === -1) {
                    startegyIds.push(backtestId);
                }
                this.updateState({ 'selectedBacktests': startegyIds });
            } else if (indexOfId >= 0) {
                startegyIds.splice(indexOfId, 1);
                this.updateState({
                    'selectedBacktests': startegyIds,
                    'allSelected': false
                });
            }

        }

        this.allBacktestsCheckboxChange = (e) => {
            let selectedBacktests = [];
            if (e.target.checked) {
                for (let i = 0; i < this.state.backtests.length; i++) {
                    selectedBacktests.push(this.state.backtests[i]._id);
                }
            }
            this.updateState({
                'selectedBacktests': selectedBacktests,
                'allSelected': e.target.checked
            });
        }

        this.runForwardTest = (record) => {
            let backtests = JSON.parse(JSON.stringify(this.state.backtests));
            for (let i = 0; i < backtests.length; i++) {
                if (record.key === backtests[i]._id) {
                    backtests[i]['isLoading'] = true;
                    break;
                }
            }
            this.updateState({ 'backtests': backtests });
            this.runForwardTestApiCall(record.key);
        }

        this.deleteSelectedBacktests = () => {
            if (this.state.selectedBacktests && this.state.selectedBacktests.length > 0) {
                this.updateState({ 'tableButtonsLoading': true });
                this.deletesCompleted = 0;
                for (let i = 0; i < this.state.selectedBacktests.length; i++) {
                    this.deleteSingleBacktest(this.state.selectedBacktests[i]);
                }
            }
        }


        this.deleteSingleBacktest = (backtestId) => {
            axios({
                method: 'DELETE',
                url: Utils.getBaseUrl() + '/backtest/' + backtestId,
                'headers': Utils.getAuthTokenHeader()
            })
                .then((response) => {
                    this.deletesCompleted = this.deletesCompleted + 1;
                    if (this.deletesCompleted === this.state.selectedBacktests.length) {
                        this.updateBacktestsDeleted();
                    }
                })
                .catch((error) => {
                    Utils.checkForInternet(error, this.props.history);
                    if (error.response) {
                        if (error.response.status === 400 || error.response.status === 403) {
                            this.props.history.push('/forbiddenAccess');
                        }
                        Utils.checkErrorForTokenExpiry(error, this.props.history, this.props.match.url);
                    }
                    this.deletesCompleted = this.deletesCompleted + 1;
                    if (this.deletesCompleted === this.state.selectedBacktests.length) {
                        this.updateBacktestsDeleted();
                    }
                });
        }

        this.updateBacktestsDeleted = () => {
            if (this.state.selectedBacktests) {
                let backtests = [];
                for (let i = 0; i < this.state.backtests.length; i++) {
                    if (this.state.selectedBacktests.indexOf(this.state.backtests[i]._id) === -1) {
                        backtests.push(this.state.backtests[i]);
                    }
                }
                if (backtests.length > 0) {
                    this.updateState({
                        'tableButtonsLoading': false,
                        'selectedBacktests': [],
                        'backtests': backtests,
                        'allSelected': false
                    });
                } else {
                    this.props.history.push('/research');
                }
            } else {
                this.updateState({ 'tableButtonsLoading': false });
            }
        }

        this.showDeleteConfirm = (title, content) => {
            // Modal.confirm({
            //     title: title,
            //     content: content,
            //     okText: 'Yes',
            //     okType: 'danger',
            //     cancelText: 'No',
            //     onOk: () => {
            //         this.deleteSelectedBacktests()
            //     },
            //     onCancel: () => {
            //     },
            // });
            return null;
        }

        this.showcompareModal = () => {
            this.updateState({ 'backtestsCompareModalVisible': true });
        }
    }

    componentDidMount() {
        this._mounted = true;
        if (!Utils.isLoggedIn()) {
            Utils.goToLoginPage(this.props.history, window.location.href);
        } else {
            // this.props.pageChange('research');
            if (this._mounted) {
                this.getStrategy();
            }
        }
    }

    componentWillUnmount() {
        this._mounted = false;
        if (this.cancelGetBackTests) {
            this.cancelGetBackTests();
        }
        if (this.cancelGetStrategy) {
            this.cancelGetStrategy();
        }
    }

    rowSelection = (checked, row) => {
        const clonedBacktests = _.map(this.state.backtests, _.cloneDeep);
        const rowBacktestId = _.get(row, '_id', null);
        const selectedRowIndex = _.findIndex(clonedBacktests, backtest => backtest._id === rowBacktestId);
        if (selectedRowIndex > -1) {
            clonedBacktests[selectedRowIndex].selected = checked;
            this.setState({backtests: clonedBacktests});
        }
        console.log('Row ', row);
        console.log('Checked  ', checked);
    }

    render() {
        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                this.updateState({
                    'selectedBacktests': selectedRowKeys
                })
            }
        };

        // const getCompareModal = () => {
        //   const selectedBacktests = {};
        //   for(let i=0; i<this.state.backtests.length; i++){
        //     if (this.state.selectedBacktests.indexOf(this.state.backtests[i]._id) > -1){
        //       selectedBacktests[this.state.backtests[i]._id] = 'Backtest ' + (i+1);
        //     }
        //   }
        //   return (
        //     <Modal
        //       title="Bactests compare"
        //       wrapClassName="vertical-center-modal"
        //       visible={this.state.backtestsCompareModalVisible}
        //       footer={null}
        //       onCancel={() => this.updateState({'backtestsCompareModalVisible': false})}
        //       className="attach-backtest-model no-padding" 
        //     >
        //       {(this.state.backtestsCompareModalVisible) ? (<Compare 
        //         selectedBacktests={selectedBacktests}
        //         strategy={this.state.strategy}
        //         />) : null}
        //     </Modal>
        //   );
        // }

        const getTableButtons = () => {
            if (!this.state.loading) {
                if (this.state.tableButtonsLoading) {
                    return (
                        <div style={{
                            'display': 'flex',
                            'alignItems': 'center', 'justifyContent': 'center',
                            'minWidth': '100px'
                        }}>
                            <CircularProgress size={22} />
                        </div>
                    );
                } else {
                    return (
                        <React.Fragment>
                            {getCompareButton()}
                            {/* {getCompareModal()} */}
                            {getDeleteButton()}
                        </React.Fragment>
                    );
                }
            }
        }

        const getCompareButton = () => {
            return (
                <Button 
                        style={{ 'marginRight': '10px' }} 
                        color="primary"
                        // onClick={() => this.showcompareModal()}
                        disabled={
                            this.state.selectedBacktests && 
                            this.state.selectedBacktests.length > 1 &&
                            this.state.selectedBacktests.length <= 5
                        }
                >
                    Compare
                </Button>
            );
        }

        const getDeleteButton = () => {
            if (this.state.selectedBacktests && this.state.selectedBacktests.length > 0) {
                return (
                    <Button 
                            color="secondary"
                            onClick={() => {
                                this.showDeleteConfirm('Are you sure you want to delete?', this.state.selectedBacktests.length + ' backtests will be deleted.')}
                            }
                    >
                        <Icon>delete</Icon>Delete Selected
                    </Button>
                );
            } else {
                return (
                    <Button color="secondary" disabled>
                        <Icon>delete</Icon>Delete Selected
                    </Button>
                );
            }
        }

        const getBacktestsDiv = () => {
            if (this.state.loading) {
                return (
                    <div style={{
                        'display': 'flex',
                        'alignItems': 'center', 'justifyContent': 'center',
                        'minHeight': '300px'
                    }}>
                        <CircularProgress size={22} />
                    </div>
                );
            } else {
                return (
                    <div>
                        <Grid container>
                            <Grid item md={6} sm={12}>
                                <h2>All Backtests for {this.state.strategy.name}</h2>
                            </Grid>
                            <Grid item md={6} sm={12}>
                                <div style={{ 'display': 'flex', 'justifyContent': 'flex-end' }}>
                                    {getTableButtons()}
                                </div>
                            </Grid>
                        </Grid>
                        <BacktestsTable 
                            data={this.state.backtests}
                            rowSelection={this.rowSelection}
                        />
                        {/* <Table 
                            rowSelection={rowSelection}
                            dataSource={data} 
                            pagination={false} 
                            style={{ 'border': '1px solid #e1e1e1' }}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        this.props.history.push('/research/backtests/'
                                            + this.props.match.params.strategyId + '/' + record.key
                                            + '?type=backtest&strategyName=' + this.state.strategy.name
                                            + '&backtestName=' + record.name);
                                    }
                                };
                            }
                            }
                        >
                            {columns}
                        </Table> */}
                    </div>
                );
            }
        }

        // const getBreadCrumbAllBacktests = () => {
        //   if (!this.state.loading){
        //     return(
        //       <Breadcrumb separator=">" className="location-breadcrumb">
        //           <Breadcrumb.Item>Research</Breadcrumb.Item>
        //           <Breadcrumb.Item><Link to="/research">All Strategies</Link></Breadcrumb.Item>
        //           <Breadcrumb.Item><Link to={"/research/strategy/"+this.state.strategy._id}>{this.state.strategy.name}</Link></Breadcrumb.Item>
        //           <Breadcrumb.Item className="last">All Backtests</Breadcrumb.Item>
        //       </Breadcrumb>
        //     );
        //   }
        // }

        const getTotalDiv = () => {
            return (
                <div 
                        className="research-div" 
                        style={{ 
                            padding: '1% 3% 1% 3%', 
                            width: '90vw', 
                            minHeight: 'calc(100vh - 70px)' 
                        }}
                >
                    <div style={{ 'display': 'flex', 'marginBottom': '10px' }}>
                        <div>
                            <h2 style={{ 'color': '#3c3c3c', 'fontWeight': 'normal', 'margin': '0px' }}>All Backtests</h2>
                            {/* {getBreadCrumbAllBacktests()} */}
                        </div>
                    </div>
                    <div className="card" style={{
                        'width': '100%', 'background': 'white',
                        'padding': '40px 2%'
                    }}>
                        {getBacktestsDiv()}
                    </div>
                </div>
            );
        }

        return (
            <AqDesktopLayout loading={this.state.loading}>
                {getTotalDiv()}                 
            </AqDesktopLayout>
        );
    }
}

export default withRouter(StrategyBacktests);
