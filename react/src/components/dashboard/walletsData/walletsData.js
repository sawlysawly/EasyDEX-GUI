import React from 'react';
import { translate } from '../../../translate/translate';
import { sortByDate } from '../../../util/sort';
import { formatValue } from '../../../util/formatValue';
import Config from '../../../config';
import {
  basiliskRefresh,
  basiliskConnection,
  toggleDashboardTxInfoModal,
  getBasiliskTransactionsList,
  changeMainBasiliskAddress,
  displayNotariesModal,
  toggleViewCacheModal,
  changeActiveAddress,
  restartBasiliskInstance,
  connectNotaries,
  getDexNotaries,
  deleteCacheFile,
  fetchNewCacheData,
  fetchUtxoCache,
  getNativeTxHistory,
  getFullTransactionsList
} from '../../../actions/actionCreators';
import Store from '../../../store';
import {
  PaginationItemRender,
  PaginationItemsPerPageSelectorRender,
  PaginationRender,
  TxHistoryListRender,
  AddressListRender,
  WalletsDataRender
} from  './walletsData.render';

import { SocketProvider } from 'socket.io-react';
import io from 'socket.io-client';

const socket = io.connect(`http://127.0.0.1:${Config.agamaPort}`);

class WalletsData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      basiliskActionsMenu: false,
      itemsPerPage: 10,
      activePage: 1,
      itemsList: null,
      currentAddress: null,
      addressSelectorOpen: false,
      currentStackLength: 0,
      totalStackLength: 0,
      useCache: true,
    };
    this.updateInput = this.updateInput.bind(this);
    this.toggleBasiliskActionsMenu = this.toggleBasiliskActionsMenu.bind(this);
    this.basiliskRefreshAction = this.basiliskRefreshAction.bind(this);
    this.basiliskConnectionAction = this.basiliskConnectionAction.bind(this);
    this.getDexNotariesAction = this.getDexNotariesAction.bind(this);
    this.openDropMenu = this.openDropMenu.bind(this);
    this.removeAndFetchNewCache = this.removeAndFetchNewCache.bind(this);
    this._toggleViewCacheModal = this._toggleViewCacheModal.bind(this);
    this.toggleCacheApi = this.toggleCacheApi.bind(this);
    this._fetchUtxoCache = this._fetchUtxoCache.bind(this);
    this.restartBasiliskInstance = this.restartBasiliskInstance.bind(this);
    this.basiliskRefreshActionOne = this.basiliskRefreshActionOne.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.refreshTxHistory = this.refreshTxHistory.bind(this);
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );

    setTimeout(() => {
      if (this.props.ActiveCoin.mode === 'basilisk' || (Object.keys(this.props.Main.coins.basilisk).length && (Object.keys(this.props.Main.coins.native).length || Object.keys(this.props.Main.coins.full).length)) || Object.keys(this.props.Main.coins.basilisk).length) {
        socket.on('messages', msg => this.updateSocketsData(msg));
      } else {
        socket.removeAllListeners('messages');
      }
    }, 100);
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );

    socket.removeAllListeners('messages');
  }

  handleClickOutside(e) {
    if (e.srcElement.className !== 'btn dropdown-toggle btn-info' &&
        (e.srcElement.offsetParent && e.srcElement.offsetParent.className !== 'btn dropdown-toggle btn-info') &&
        (e.path && e.path[4] && e.path[4].className.indexOf('showkmdwalletaddrs') === -1) &&
        (e.srcElement.offsetParent && e.srcElement.offsetParent.className.indexOf('dropdown') === -1) &&
        e.srcElement.className !== 'dropdown-toggle btn-xs btn-default') {
      this.setState({
        addressSelectorOpen: false,
        basiliskActionsMenu: false,
      });
    }
  }

  // deprecated
  toggleCacheApi() {
    const _useCache = !this.state.useCache;

    sessionStorage.setItem('useCache', _useCache);
    this.setState(Object.assign({}, this.state, {
      useCache: _useCache,
    }));
  }

  restartBasiliskInstance() {
    Store.dispatch(restartBasiliskInstance());
  }

  _toggleViewCacheModal() {
    Store.dispatch(toggleViewCacheModal(!this.props.Dashboard.displayViewCacheModal));
  }

  updateSocketsData(data) {
    if (this.props.ActiveCoin.mode === 'basilisk') {
      if (data &&
          data.message &&
          data.message.shepherd.iguanaAPI &&
          data.message.shepherd.iguanaAPI.totalStackLength) {
        this.setState(Object.assign({}, this.state, {
          totalStackLength: data.message.shepherd.iguanaAPI.totalStackLength,
        }));
      }
      if (data &&
          data.message &&
          data.message.shepherd.iguanaAPI &&
          data.message.shepherd.iguanaAPI.currentStackLength) {
        this.setState(Object.assign({}, this.state, {
          currentStackLength: data.message.shepherd.iguanaAPI.currentStackLength,
        }));
      }
      if (data &&
          data.message &&
          data.message.shepherd.method &&
          data.message.shepherd.method === 'cache-one' &&
          data.message.shepherd.status === 'done') {
        Store.dispatch(basiliskRefresh(false));
      }
    }
  }

  refreshTxHistory() {
    const _mode = this.props.ActiveCoin.mode;
    const _coin = this.props.ActiveCoin.coin;

    switch(_mode) {
      case 'basilisk':
        Store.dispatch(fetchNewCacheData({
          'pubkey': this.props.Dashboard.activeHandle.pubkey,
          'allcoins': false,
          'coin': _coin,
          'calls': 'listtransactions',
          'skip': true,
          'address': this.state.currentAddress,
        }));
        break;
      case 'native':
        Store.dispatch(getNativeTxHistory(_coin));
        break;
      case 'full':
        Store.dispatch(getFullTransactionsList(_coin));
        break;
    }
  }

  removeAndFetchNewCache() {
    Store.dispatch(deleteCacheFile({
      'pubkey': this.props.Dashboard.activeHandle.pubkey,
      'allcoins': false,
      'coin': this.props.ActiveCoin.coin,
      'calls': 'listtransactions:getbalance',
      'address': this.state.currentAddress,
    }));
  }

  _fetchUtxoCache() {
    Store.dispatch(fetchUtxoCache({
      'pubkey': this.props.Dashboard.activeHandle.pubkey,
      'allcoins': false,
      'coin': this.props.ActiveCoin.coin,
      'calls': 'refresh',
      'address': this.state.currentAddress,
    }));
  }

  toggleBasiliskActionsMenu() {
    this.setState(Object.assign({}, this.state, {
      basiliskActionsMenu: !this.state.basiliskActionsMenu,
    }));
  }

  basiliskRefreshAction() {
    Store.dispatch(fetchNewCacheData({
      'pubkey': this.props.Dashboard.activeHandle.pubkey,
      'allcoins': false,
      'coin': this.props.ActiveCoin.coin,
      'calls': 'listtransactions:getbalance',
    }));
  }

  basiliskRefreshActionOne() {
    Store.dispatch(fetchNewCacheData({
      'pubkey': this.props.Dashboard.activeHandle.pubkey,
      'allcoins': false,
      'coin': this.props.ActiveCoin.coin,
      'calls': 'listtransactions:getbalance',
      'address': this.props.ActiveCoin.activeAddress,
    }));
  }

  basiliskConnectionAction() {
    if (this.props.Dashboard) {
      Store.dispatch(basiliskConnection(!this.props.Dashboard.basiliskConnection));
      Store.dispatch(connectNotaries());
    }
  }

  getDexNotariesAction() {
    Store.dispatch(getDexNotaries(this.props.ActiveCoin.coin));
    Store.dispatch(displayNotariesModal(true));
  }

  updateInput(e) {
    let historyToSplit = sortByDate(this.props.ActiveCoin.txhistory);
    historyToSplit = historyToSplit.slice(0, e.target.value);

    this.setState({
      [e.target.name]: e.target.value,
      activePage: 1,
      itemsList: historyToSplit,
    });
  }

  toggleTxInfoModal(display, txIndex) {
    Store.dispatch(toggleDashboardTxInfoModal(display, txIndex));
  }

  componentWillReceiveProps(props) {
    let historyToSplit;
    let stateObj = {};

    if (this.props &&
        this.props.ActiveCoin &&
        this.props.ActiveCoin.coin) {
      if (!this.state.currentAddress &&
          this.props.ActiveCoin.activeAddress) {
        stateObj = Object.assign(stateObj, {
          currentAddress: this.props.ActiveCoin.activeAddress,
        });
      }

      if (this.props.ActiveCoin.txhistory &&
          this.props.ActiveCoin.txhistory !== 'loading' &&
          this.props.ActiveCoin.txhistory !== 'no data' &&
          this.props.ActiveCoin.txhistory.length) {
        if (!this.state.itemsList ||
            (this.state.itemsList && !this.state.itemsList.length) ||
            (props.ActiveCoin.txhistory !== this.props.ActiveCoin.txhistory)) {
          historyToSplit = sortByDate(this.props.ActiveCoin.txhistory);
          historyToSplit = historyToSplit.slice(
            (this.state.activePage - 1) * this.state.itemsPerPage,
            this.state.activePage * this.state.itemsPerPage
          );

          stateObj = Object.assign(stateObj, {
            itemsList: historyToSplit,
          });
        }
      }

      if (!historyToSplit &&
          this.props.ActiveCoin.txhistory &&
          this.props.ActiveCoin.txhistory === 'no data') {
        stateObj = Object.assign(stateObj, {
          itemsList: 'no data',
        });
      } else if (!historyToSplit && this.props.ActiveCoin.txhistory && this.props.ActiveCoin.txhistory === 'loading') {
        stateObj = Object.assign(stateObj, {
          itemsList: 'loading',
        });
      } else if ( // dirty first txhistory load workaround
        !historyToSplit &&
        this.props.ActiveCoin.txhistory &&
        this.props.ActiveCoin.txhistory !== 'loading' &&
        this.props.ActiveCoin.txhistory !== 'no data' &&
        this.props.ActiveCoin.txhistory.length
        ) {
        historyToSplit = sortByDate(this.props.ActiveCoin.txhistory);
        historyToSplit = historyToSplit.slice(
          (this.state.activePage - 1) * this.state.itemsPerPage,
          this.state.activePage * this.state.itemsPerPage
        );

        stateObj = Object.assign(stateObj, {
          itemsList: historyToSplit,
        });
      }
    }

    this.setState(Object.assign({}, this.state, stateObj));
  }

  updateCurrentPage(page) {
    let historyToSplit = sortByDate(this.props.ActiveCoin.txhistory);
    historyToSplit = historyToSplit.slice(
      (page - 1) * this.state.itemsPerPage,
      page * this.state.itemsPerPage
    );

    this.setState(Object.assign({}, this.state, {
      activePage: page,
      itemsList: historyToSplit,
    }));
  }

  renderPaginationItems() {
    let items = [];

    for (let i = 0; i < Math.ceil(this.props.ActiveCoin.txhistory.length / this.state.itemsPerPage); i++) {
      items.push(
        PaginationItemRender.call(this, i)
      );
    }

    return items;
  }

  renderPaginationItemsPerPageSelector() {
    if (this.props.ActiveCoin.txhistory &&
        this.state.itemsList !== 'loading' &&
        this.props.ActiveCoin.txhistory.length > 10) {
      return PaginationItemsPerPageSelectorRender.call(this);
    } else {
      return null;
    }
  }

  renderPagination() {
    if (this.props.ActiveCoin.txhistory &&
        this.state.itemsList !== 'loading' &&
        this.props.ActiveCoin.txhistory.length > 10) {
      const _paginationFrom = ((this.state.activePage - 1) * this.state.itemsPerPage) + 1;
      const _paginationTo = this.state.activePage * this.state.itemsPerPage;

      return PaginationRender.call(
        this,
        _paginationFrom,
        _paginationTo
      );
    } else {
      return null;
    }
  }

  renderTxType(category) {
    if (category === 'send' ||
        category === 'sent') {
      return (
        <span className="label label-danger">
          <i className="icon fa-arrow-circle-left"></i> <span>{ translate('DASHBOARD.OUT') }</span>
        </span>
      );
    }
    if (category === 'receive' ||
        category === 'received') {
      return (
        <span className="label label-success">
          <i className="icon fa-arrow-circle-right"></i> <span>{ translate('DASHBOARD.IN') }</span>
        </span>
      );
    }
    if (category === 'generate') {
      return (
        <span>
          <i className="icon fa-cogs"></i> <span>{ translate('DASHBOARD.MINED') }</span>
        </span>
      );
    }
    if (category === 'immature') {
      return (
        <span>
          <i className="icon fa-clock-o"></i> <span>{ translate('DASHBOARD.IMMATURE') }</span>
        </span>
      );
    }
    if (category === 'unknown') {
      return (
        <span>
          <i className="icon fa-meh-o"></i> <span>{ translate('DASHBOARD.UNKNOWN') }</span>
        </span>
      );
    }
  }

  isFullySynced() {
    if (this.props.Dashboard.progress &&
        (Number(this.props.Dashboard.progress.balances) +
        Number(this.props.Dashboard.progress.validated) +
        Number(this.props.Dashboard.progress.bundles) +
        Number(this.props.Dashboard.progress.utxo)) / 4 === 100) {
      return true;
    } else {
      return false;
    }
  }

  // TODO: add basilisk first run check, display no data if second run
  renderTxHistoryList() {
    if (this.state.itemsList === 'loading') {
      if (!this.isNativeMode() || this.isFullySynced()) {
        return (
          <tr className="hover--none">
            <td colSpan="7">{ translate('INDEX.LOADING_HISTORY') }...</td>
          </tr>
        );
      }
    } else if (this.state.itemsList === 'no data') {
      return (
        <tr className="hover--none">
          <td colSpan="7">{ translate('INDEX.NO_DATA') }</td>
        </tr>
      );
    } else {
      if (this.state.itemsList &&
          this.state.itemsList.length &&
          this.state.itemsList !== 'no data') {
        return this.state.itemsList.map((tx, index) =>
          TxHistoryListRender.call(
            this,
            tx,
            index
          )
        );
      }
    }
  }

  updateAddressSelection(address, type, amount) {
    Store.dispatch(changeActiveAddress(address));

    this.setState(Object.assign({}, this.state, {
      currentAddress: address,
      addressSelectorOpen: false,
      activePage: 1,
    }));

    if (this.props.ActiveCoin.mode === 'basilisk') {
      setTimeout(() => {
        Store.dispatch(changeMainBasiliskAddress(address));
        Store.dispatch(
          getBasiliskTransactionsList(
            this.props.ActiveCoin.coin,
            address
          )
        );
      }, 100);

      Store.dispatch(fetchNewCacheData({
        'pubkey': this.props.Dashboard.activeHandle.pubkey,
        'allcoins': false,
        'coin': this.props.ActiveCoin.coin,
        'calls': 'listtransactions:getbalance',
        'address': address,
      }));
    }
  }

  openDropMenu() {
    this.setState(Object.assign({}, this.state, {
      addressSelectorOpen: !this.state.addressSelectorOpen,
    }));
  }

  renderAddress(tx) {
    if (!tx.address) {
      return (
        <span>
          <i className="icon fa-bullseye"></i> <span className="label label-dark">{ translate('DASHBOARD.ZADDR_NOT_LISTED') }</span>
        </span>
      );
    }

    return tx.address;
  }

  renderAddressByType(type) {
    const _addresses = this.props.ActiveCoin.addresses;

    if (_addresses &&
        _addresses[type] &&
        _addresses[type].length) {
        let items = [];
        const _cache = this.props.ActiveCoin.cache;
        const _coin = this.props.ActiveCoin.coin;

        for (let i = 0; i < _addresses[type].length; i++) {
          const address = _addresses[type][i].address;
          let _amount = address.amount;

          if (this.props.ActiveCoin.mode === 'basilisk') {
            _amount = _cache && _cache[_coin] && _cache[_coin][address] && _cache[_coin][address].getbalance && _cache[_coin][address].getbalance.data && _cache[_coin][address].getbalance.data.balance ? _cache[_coin][address].getbalance.data.balance : 'N/A';
          }

          if (_amount !== 'N/A') {
            _amount = formatValue('round', _amount, -6);
          }

          items.push(
            <li key={address}>
              <a onClick={ () => this.updateAddressSelection(address, type, _amount) }>
                <i className={ 'icon fa-eye' + (type === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
                <span className="text">[ { _amount } { _coin } ]  { address }</span>
                <span className="glyphicon glyphicon-ok check-mark"></span>
              </a>
            </li>
          );
        }

        return items;
    } else {
      return null;
    }
  }

  hasPublicAdresses() {
    return this.props.ActiveCoin.addresses &&
      this.props.ActiveCoin.addresses.public &&
      this.props.ActiveCoin.addresses.public.length;
  }

  renderAddressAmount() {
    if (this.hasPublicAdresses()) {
      const _addresses = this.props.ActiveCoin.addresses;
      const _cache = this.props.ActiveCoin.cache;
      const _coin = this.props.ActiveCoin.coin;

      for (let i = 0; i < _addresses.public.length; i++) {
        if (_addresses.public[i].address === this.state.currentAddress) {
          if (_addresses.public[i].amount &&
              _addresses.public[i].amount !== 'N/A') {
            return _addresses.public[i].amount;
          } else {
            const address = _addresses.public[i].address;
            let _amount = _cache && _cache[_coin] && _cache[_coin][address] && _cache[_coin][address].getbalance.data && _cache[_coin][address].getbalance.data.balance ? _cache[_coin][address].getbalance.data.balance : 'N/A';

            _amount = formatValue('round', _amount, -6);

            return _amount;
          }
        }
      }
    } else {
      return 0;
    }
  }

  renderSelectorCurrentLabel() {
    if (this.state.currentAddress) {
      return (
        <span>
          <i className={ 'icon fa-eye' + (this.state.addressType === 'public' ? '' : '-slash') }></i>&nbsp;&nbsp;
          <span className="text">
            [ { this.renderAddressAmount() } { this.props.ActiveCoin.coin } ]&nbsp;&nbsp;
            { this.state.currentAddress }
          </span>
        </span>
      );
    } else {
      return (
        <span>- { translate('KMD_NATIVE.SELECT_ADDRESS') } -</span>
      );
    }
  }

  renderAddressList() {
    if (this.props.Dashboard &&
        this.props.Dashboard.activeHandle &&
        this.props.Dashboard.activeHandle[this.props.ActiveCoin.coin] &&
        this.props.ActiveCoin.mode === 'basilisk') {
      return AddressListRender.call(this);
    } else {
      return null;
    }
  }

  isActiveCoinMode(coinMode) {
    return this.props.ActiveCoin.mode === coinMode;
  }

  isNativeMode() {
    return this.isActiveCoinMode('native');
  }

  isFullMode() {
    return this.isActiveCoinMode('full');
  }

  isBasiliskMode() {
    return this.isActiveCoinMode('basilisk');
  }

  render() {
    if (this.props &&
        this.props.ActiveCoin &&
        this.props.ActiveCoin.coin &&
        (
          this.props.ActiveCoin.mode !== 'native' &&
          !this.props.ActiveCoin.send &&
          !this.props.ActiveCoin.receive
        ) || (
          this.props.ActiveCoin.mode === 'native' &&
          this.props.ActiveCoin.nativeActiveSection === 'default'
        )) {
      return WalletsDataRender.call(this);
    } else {
      return null;
    }
  }
}

export default WalletsData;
